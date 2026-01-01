import Stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";
import Show from "../models/Show.js";

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
    const markPaid = async ({ bookingId, paymentSessionId }) => {
      if (!bookingId) return;

      const booking = await Booking.findById(bookingId);
      if (!booking) return;

      const wasPaid = booking.isPaid;
      booking.isPaid = true;
      booking.paymentLink = "";
      if (paymentSessionId && !booking.paymentSessionId) {
        booking.paymentSessionId = paymentSessionId;
      }
      await booking.save();

      const show = await Show.findById(booking.show);
      if (show) {
        booking.bookedSeats.forEach((seat) => {
          show.occupiedSeats[seat] = booking.user;
        });
        show.markModified("occupiedSeats");
        await show.save();
      }

      if (!wasPaid) {
        await inngest.send({
          name: "app/show.booked",
          data: { bookingId },
        });
      }
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { bookingId } = session.metadata || {};
        await markPaid({ bookingId, paymentSessionId: session.id });
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const session = sessionList.data?.[0];
        const { bookingId } = session?.metadata || {};
        await markPaid({ bookingId, paymentSessionId: session?.id });

        break;
      }

      default:
        console.log("unhandled event type :", event.type);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error", error);
    res.status(500).send("Internal Server Error");
  }
};
