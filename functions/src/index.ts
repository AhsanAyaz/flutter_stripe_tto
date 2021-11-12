import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

//initialize firebase inorder to access its services
admin.initializeApp(functions.config().firebase);

import * as env from "dotenv";
// Replace if using a different env file or config.
env.config({ path: "./.env" });

import * as bodyParser from "body-parser";
import * as express from "express";

import Stripe from "stripe";
import { generateResponse } from "./utils";

const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

const app = express();

app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    if (req.originalUrl === "/webhook") {
      next();
    } else {
      bodyParser.json()(req, res, next);
    }
  }
);

// tslint:disable-next-line: interface-name
interface Order {
  items: object[];
}

const calculateOrderAmount = (_order?: Order): number => {
  // Replace this constant with a calculation of the order's amount.
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client.
  return 2500;
};

function getKeys() {
  let secret_key: string | undefined = stripeSecretKey;
  let publishable_key: string | undefined = stripePublishableKey;

  publishable_key = process.env.STRIPE_PUBLISHABLE_KEY;
  secret_key = process.env.STRIPE_SECRET_KEY;

  return { secret_key, publishable_key };
}

app.post(
  "/pay-without-webhooks",
  async (req: express.Request, res: express.Response): Promise<void> => {
    const {
      paymentMethodId,
      paymentIntentId,
      items,
      currency,
      useStripeSdk,
      cvcToken,
      email,
    }: {
      paymentMethodId?: string;
      paymentIntentId?: string;
      cvcToken?: string;
      items: Order;
      currency: string;
      useStripeSdk: boolean;
      email?: string;
    } = req.body;

    const orderAmount: number = calculateOrderAmount(items);
    const { secret_key } = getKeys();

    const stripe = new Stripe(secret_key as string, {
      apiVersion: "2020-08-27",
      typescript: true,
    });

    try {
      if (cvcToken && email) {
        const customers = await stripe.customers.list({
          email,
        });

        // The list all Customers endpoint can return multiple customers that share the same email address.
        // For this example we're taking the first returned customer but in a production integration
        // you should make sure that you have the right Customer.
        if (!customers.data[0]) {
          res.send({
            error:
              "There is no associated customer object to the provided e-mail",
          });
        }

        const paymentMethods = await stripe.paymentMethods.list({
          customer: customers.data[0].id,
          type: "card",
        });

        if (!paymentMethods.data[0]) {
          res.send({
            error: `There is no associated payment method to the provided customer's e-mail`,
          });
        }

        const params: Stripe.PaymentIntentCreateParams = {
          amount: orderAmount,
          confirm: true,
          confirmation_method: "manual",
          currency,
          payment_method: paymentMethods.data[0].id,
          payment_method_options: {
            card: {
              cvc_token: cvcToken,
            },
          },
          use_stripe_sdk: useStripeSdk,
          customer: customers.data[0].id,
        };
        const intent = await stripe.paymentIntents.create(params);
        res.send(generateResponse(intent));
      } else if (paymentMethodId) {
        // Create new PaymentIntent with a PaymentMethod ID from the client.
        const params: Stripe.PaymentIntentCreateParams = {
          amount: orderAmount,
          confirm: true,
          confirmation_method: "manual",
          currency,
          payment_method: paymentMethodId,
          // If a mobile client passes `useStripeSdk`, set `use_stripe_sdk=true`
          // to take advantage of new authentication features in mobile SDKs.
          use_stripe_sdk: useStripeSdk,
        };
        const intent = await stripe.paymentIntents.create(params);
        // After create, if the PaymentIntent's status is succeeded, fulfill the order.
        res.send(generateResponse(intent));
      } else if (paymentIntentId) {
        // Confirm the PaymentIntent to finalize payment after handling a required action
        // on the client.
        const intent = await stripe.paymentIntents.confirm(paymentIntentId);
        // After confirm, if the PaymentIntent's status is succeeded, fulfill the order.
        res.send(generateResponse(intent));
      }
    } catch (e) {
      // Handle "hard declines" e.g. insufficient funds, expired card, etc
      // See https://stripe.com/docs/declines/codes for more.
      res.send({ error: e.message });
    }
  }
);

export const webApi = functions.https.onRequest(app);
