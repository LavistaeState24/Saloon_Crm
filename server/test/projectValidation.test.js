import assert from "node:assert/strict";
import mongoose from "mongoose";

import { Project } from "../src/models/Project.js";
import { validateProjectInput } from "../src/validators/projectValidator.js";

const createdBy = new mongoose.Types.ObjectId().toString();

const basePayload = {
  projectName: "Keratin Glow Package",
  publicAlias: "Keratin Glow",
  location: "Andheri Branch",
  area: "Andheri West",
  configuration: "60 min",
  sizeRange: { label: "60 min", min: 60, max: 60, unit: "min" },
  priceRange: { min: 3500, max: 5500 },
  totalBlocks: 1,
  totalUnits: 20,
  possessionDate: "2026-06-25",
  amenities: "Hair wash, Blow dry",
  hasSampleVideo: false,
  status: "Available",
};

const tests = [
  [
    "Salon service categories validate",
    () => {
      const payload = validateProjectInput({
        ...basePayload,
        propertyType: ["Hair", "Spa", "Bridal"],
      });

      assert.deepEqual(payload.propertyType, ["Hair", "Spa", "Bridal"]);
      assert.equal(payload.status, "Available");
    },
  ],
  [
    "Legacy service categories still validate",
    () => {
      const payload = validateProjectInput({
        ...basePayload,
        propertyType: ["Apartment", "Villa", "Penthouse"],
        status: "By Appointment Only",
      });

      assert.deepEqual(payload.propertyType, ["Apartment", "Villa", "Penthouse"]);
      assert.equal(payload.status, "By Appointment Only");
    },
  ],
  [
    "Project model accepts salon categories",
    () => {
      const project = new Project({
        ...basePayload,
        propertyType: ["Hair", "Skin"],
        createdBy,
      });

      assert.equal(project.validateSync(), undefined);
    },
  ],
  [
    "Project model accepts legacy categories",
    () => {
      const project = new Project({
        ...basePayload,
        propertyType: ["Apartment", "Commercial"],
        status: "Not Available",
        createdBy,
      });

      assert.equal(project.validateSync(), undefined);
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
