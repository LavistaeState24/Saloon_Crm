import assert from "node:assert/strict";
import mongoose from "mongoose";

import { Deal } from "../src/models/Deal.js";
import { validateDealInput } from "../src/validators/dealValidator.js";

const currentUser = {
  _id: new mongoose.Types.ObjectId().toString(),
};

const leadId = new mongoose.Types.ObjectId().toString();
const projectId = new mongoose.Types.ObjectId().toString();
const billerId = new mongoose.Types.ObjectId().toString();

const tests = [
  [
    "Draft invoice payload validates with the base fields",
    () => {
      const payload = validateDealInput(
        {
          leadId,
          finalProject: projectId,
          dealStatus: "Negotiation",
          finalUnit: "Hair Spa Package",
          tokenAmount: "500",
          paymentStatus: "Pending",
        },
        currentUser,
      );

      assert.equal(payload.leadId, leadId);
      assert.equal(payload.finalProject, projectId);
      assert.equal(payload.dealStatus, "Negotiation");
      assert.equal(payload.finalUnit, "Hair Spa Package");
      assert.equal(payload.tokenAmount, 500);
      assert.equal(payload.paymentStatus, "Pending");
    },
  ],
  [
    "Paid invoice payload validates and keeps billing fields",
    () => {
      const payload = validateDealInput(
        {
          leadId,
          finalProject: projectId,
          dealStatus: "Closed",
          finalPrice: "3500",
          brokerageDetails: "Keratin service and aftercare notes",
          bookingDate: "2026-06-24",
          dealClosedBy: billerId,
          tokenAmount: "1500",
          paymentStatus: "Paid",
          documentsPending: "false",
        },
        currentUser,
      );

      assert.equal(payload.dealStatus, "Closed");
      assert.equal(payload.finalPrice, 3500);
      assert.equal(payload.brokerageDetails, "Keratin service and aftercare notes");
      assert.equal(payload.bookingDate instanceof Date, true);
      assert.equal(String(payload.dealClosedBy), billerId);
      assert.equal(payload.tokenAmount, 1500);
      assert.equal(payload.paymentStatus, "Paid");
      assert.equal(payload.documentsPending, false);
    },
  ],
  [
    "Paid invoice schema requires the billing fields",
    async () => {
      const invoice = new Deal({
        leadId,
        finalProject: projectId,
        dealStatus: "Closed",
        createdBy: currentUser._id,
      });

      await assert.rejects(invoice.validate(), (error) => {
        assert.equal(error.errors.finalPrice?.message, "Bill amount is required when invoice is Paid");
        assert.equal(error.errors.brokerageDetails?.message, "Service notes are required when invoice is Paid");
        assert.equal(error.errors.bookingDate?.message, "Billing date is required when invoice is Paid");
        assert.equal(error.errors.dealClosedBy?.message, "Billed by is required when invoice is Paid");
        return true;
      });
    },
  ],
  [
    "Paid invoice schema passes when required billing fields are present",
    () => {
      const invoice = new Deal({
        leadId,
        finalProject: projectId,
        dealStatus: "Closed",
        finalPrice: 3500,
        brokerageDetails: "Keratin service and aftercare notes",
        bookingDate: new Date("2026-06-24"),
        dealClosedBy: billerId,
        createdBy: currentUser._id,
      });

      const validationError = invoice.validateSync();

      assert.equal(validationError, undefined);
    },
  ],
];

let failures = 0;

for (const [name, fn] of tests) {
  try {
    await Promise.resolve(fn());
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

if (failures) {
  process.exitCode = 1;
  console.error(`\n${failures} test(s) failed`);
} else {
  console.log(`\n${tests.length} test(s) passed`);
}
