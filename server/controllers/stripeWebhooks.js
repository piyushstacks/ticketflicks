import Stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";

export const stripeWebhooks = async (req, res) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

  const sig = req.headers["stripe-signature"];
  let event;

  console.log("Stripe webhook received");

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
    console.log("Stripe event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;

        if (bookingId && session.payment_status === "paid") {
          await Booking.findByIdAndUpdate(bookingId, {
            isPaid: true,
            paymentLink: "",
          });

          await inngest.send({
            name: "app/show.booked",
            data: { bookingId },
          });
        } else {
          console.log(
            "checkout.session.completed missing bookingId or not paid",
            {
              bookingId,
              payment_status: session.payment_status,
            }
          );
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const session = sessionList.data[0];
        const { bookingId } = session.metadata;

        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, {
            isPaid: true,
            paymentLink: "",
          });

          await inngest.send({
            name: "app/show.booked",
            data: { bookingId },
          });
        } else {
          console.log(
            "payment_intent.succeeded session has no bookingId in metadata"
          );
        }

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
