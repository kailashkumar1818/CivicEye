export function formatComplaintId(seqNumber, year = new Date().getFullYear()) {
  return `CE-${year}-${String(seqNumber).padStart(6, '0')}`;
}

export default formatComplaintId;

