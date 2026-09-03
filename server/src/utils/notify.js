import Notification from "../models/Notification.js";

export async function notifyUser({ userId, type, title, message, relatedOrgan, relatedMatch, relatedAllocation }) {
  return Notification.create({
    recipientUser: userId,
    type,
    title,
    message,
    relatedOrgan,
    relatedMatch,
    relatedAllocation,
  });
}
