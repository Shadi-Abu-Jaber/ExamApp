// Text ids for new records. The schema defines `id` as TEXT (not a serial),
// so the application generates the id itself — in the same format used by the
// client models, e.g. "exam_1720000000000_a1b2c".
export function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
