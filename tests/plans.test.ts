import assert from "node:assert/strict"
import test from "node:test"
import { getAiMonthlyLimit, getVehicleLimit, normalizePlan } from "../lib/plans.ts"

test("plan names are normalized safely", () => {
  assert.equal(normalizePlan("professional"), "Professional")
  assert.equal(normalizePlan("ELITE"), "Elite")
  assert.equal(normalizePlan("unknown"), "Essential")
})

test("vehicle and AI limits match the commercial plans", () => {
  assert.equal(getVehicleLimit("Essential"), 3)
  assert.equal(getVehicleLimit("Professional"), 12)
  assert.equal(getVehicleLimit("Elite"), null)
  assert.equal(getAiMonthlyLimit("Essential"), 0)
  assert.equal(getAiMonthlyLimit("Professional"), 150)
  assert.equal(getAiMonthlyLimit("Elite"), 500)
})
