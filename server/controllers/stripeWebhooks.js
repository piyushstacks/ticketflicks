import Stripe from "stripe";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

export async function markSeatsAndCompleteBooking(stripeInstance, bookingId, session) {
  const booking = await Booking.findById(bookingId);
  
  // Check if booking is already paid to prevent double processing
  if (!booking || booking.isPaid) {
    console.log(`Booking ${bookingId} not found or already paid`);
    return;
  }
  
  console.log(`Processing payment for booking ${bookingId}`);

  const showData = await Show.findById(booking.show);
  if (showData && showData.seatTiers) {
    for (const seat of booking.bookedSeats) {
      const tierIndex = showData.seatTiers.findIndex(
        (t) => t.tierName === seat.tierName
      );
      if (tierIndex !== -1) {
        if (!showData.seatTiers[tierIndex].occupiedSeats) {
          showData.seatTiers[tierIndex].occupiedSeats = {};
        }
        showData.seatTiers[tierIndex].occupiedSeats[seat.seatNumber] =
          booking.user.toString();
      }
    }
    showData.occupiedSeatsCount =
      (showData.occupiedSeatsCount || 0) + booking.bookedSeats.length;
    showData.markModified("seatTiers");
    await showData.save();
  }

  let receiptUrl = null;
  try {
    const paymentIntentId = session.payment_intent || session.payment_intent;
    if (paymentIntentId) {
      const pi = await stripeInstance.paymentIntents.retrieve(paymentIntentId);
      if (pi.latest_charge) {
        const charge = await stripeInstance.charges.retrieve(pi.latest_charge);
        receiptUrl = charge.receipt_url || null;
      }
    }
  } catch (e) {
    console.warn("Could not fetch Stripe receipt_url:", e.message);
  }

  await Booking.findByIdAndUpdate(bookingId, {
    isPaid: true,
    paymentLink: "",
    paymentMode: "stripe",
    receiptUrl: receiptUrl || undefined,
  });

  await inngest.send({
    name: "app/show.booked",
    data: { bookingId },
  });
}

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
    return res.status(400).send(`webhooks error ${error.message}`);
  }

  try {
    console.log("Stripe webhook received:", event.type);
    
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Checkout session completed:", session.id);
        const bookingId = session.metadata?.bookingId;

        if (bookingId && session.payment_status === "paid") {
          console.log("Processing checkout.session.completed for booking:", bookingId);
          await markSeatsAndCompleteBooking(stripeInstance, bookingId, session);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log("Payment intent succeeded:", paymentIntent.id);
        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const session = sessionList.data[0];
        const bookingId = session?.metadata?.bookingId;

        if (bookingId) {
          console.log("Processing payment_intent.succeeded for booking:", bookingId);
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
    console.error("Webhook processing error", error);
    res.status(500).send("Internal Server Error");
  }
};
