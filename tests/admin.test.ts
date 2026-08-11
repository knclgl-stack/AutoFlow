import assert from "node:assert/strict"
import test from "node:test"
import { ADMIN_EMAIL, isAdmin } from "../lib/admin.ts"

test("only the configured owner email is an admin", () => {
  assert.equal(isAdmin(ADMIN_EMAIL), true)
  assert.equal(isAdmin(`  ${ADMIN_EMAIL.toUpperCase()}  `), true)
  assert.equal(isAdmin("admin@another-domain.com"), false)
  assert.equal(isAdmin("admin@autoflow.com"), false)
  assert.equal(isAdmin(null), false)
})
