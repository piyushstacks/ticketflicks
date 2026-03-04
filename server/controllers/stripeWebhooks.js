import Stripe from "stripe";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import ShowTbls from "../models/show_tbls.js";
import { inngest } from "../inngest/index.js";

/**
 * Called after a Stripe checkout.session.completed event (or manual confirm).
 * 1. Marks seats as occupied in the show document
 * 2. Updates the booking to confirmed + payment_status completed
 * 3. Writes a row to the payments table (source of truth)
 * 4. Fires the inngest notification event
 */
export async function markSeatsAndCompleteBooking(stripeInstance, bookingId, session) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    console.warn(`[markSeatsAndCompleteBooking] Booking ${bookingId} not found`);
    return;
  }

  // Idempotency guard – don't process twice
  if (booking.payment_status === "completed") {
    console.log(`[markSeatsAndCompleteBooking] Booking ${bookingId} already paid – skipping`);
    return;
  }

  console.log(`[markSeatsAndCompleteBooking] Processing payment for booking ${bookingId}`);

  // ── 1. Mark seats occupied in show ──────────────────────────────────────
  const showData = await ShowTbls.findById(booking.show_id);
  if (showData && showData.seatTiers && Array.isArray(showData.seatTiers)) {
    for (const seat of booking.seats_booked || []) {
      // Support both tierName (old schema) and name (screens_new format)
      const tierIndex = showData.seatTiers.findIndex(
        (t) => (t.tierName || t.name) === seat.tierName
      );
      if (tierIndex !== -1) {
        if (!showData.seatTiers[tierIndex].occupiedSeats) {
          showData.seatTiers[tierIndex].occupiedSeats = {};
        }
        showData.seatTiers[tierIndex].occupiedSeats[seat.seatNumber] =
          booking.user_id.toString();
      }
    }
    showData.occupiedSeatsCount =
      (showData.occupiedSeatsCount || 0) + (booking.seats_booked || []).length;
    showData.markModified("seatTiers");
    await showData.save();
  }

  // ── 2. Fetch Stripe receipt URL ──────────────────────────────────────────
  let receiptUrl = null;
  const paymentIntentId = session.payment_intent;

  try {
    if (paymentIntentId && stripeInstance) {
      const pi = await stripeInstance.paymentIntents.retrieve(paymentIntentId);
      if (pi.latest_charge) {
        const charge = await stripeInstance.charges.retrieve(pi.latest_charge);
        receiptUrl = charge.receipt_url || null;
      }
    }
  } catch (e) {
    console.warn("[markSeatsAndCompleteBooking] Could not fetch Stripe receipt_url:", e.message);
  }

  // ── 3. Update booking document ───────────────────────────────────────────
  await Booking.findByIdAndUpdate(bookingId, {
    payment_status: "completed",
    status: "confirmed",
    payment_link: null,          // clear link once paid
    payment_method: "stripe",
    payment_id: paymentIntentId || session.id,
    ...(receiptUrl && { receiptUrl }),
  });

  // ── 4. Write to payments table (PAYMENT_TBL) ────────────────────────────
  // Prevent duplicate payment records (unique transaction_id)
  const transactionId = paymentIntentId || session.id;
  const existingPayment = await Payment.findOne({ transaction_id: transactionId });

  if (!existingPayment) {
    await Payment.create({
      booking_id: bookingId,
      amount: booking.total_amount,
      method: "stripe",
      status: "success",
      transaction_id: transactionId,
      payment_time: new Date(),
      stripe_session_id: session.id,
      stripe_payment_intent: paymentIntentId || null,
      receipt_url: receiptUrl,
    });
    console.log(`[markSeatsAndCompleteBooking] Payment record created for booking ${bookingId}`);
  }

  // ── 5. Fire notification event ───────────────────────────────────────────
  await inngest.send({
    name: "app/show.booked",
    data: { bookingId },
  });

  console.log(`[markSeatsAndCompleteBooking] Booking ${bookingId} confirmed successfully`);
}

// ────────────────────────────────────────────────────────────────────────────
// Stripe Webhook handler
// ────────────────────────────────────────────────────────────────────────────
export const stripeWebhooks = async (req, res) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("[stripeWebhooks] Signature verification failed:", error.message);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  try {
    console.log("[stripeWebhooks] Event received:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (bookingId && session.payment_status === "paid") {
          await markSeatsAndCompleteBooking(stripeInstance, bookingId, session);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1,
        });
        const session = sessionList.data[0];
        const bookingId = session?.metadata?.bookingId;
        if (bookingId) {
          await markSeatsAndCompleteBooking(stripeInstance, bookingId, {
            ...session,
            payment_intent: paymentIntent.id,
          });
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[stripeWebhooks] Processing error:", error);
    res.status(500).send("Internal Server Error");
  }
};
