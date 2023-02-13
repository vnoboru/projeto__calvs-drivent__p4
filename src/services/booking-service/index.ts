import { notFoundError } from "@/errors";
import { cannotBookingError } from "@/errors/cannot-booking-error";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";

async function getBooking(userId: number) {
  const booking = await bookingRepository.getBooking(userId);

  if (!booking) {
    throw notFoundError();
  }

  return booking;
}

async function postBooking(userId: number, roomId: number) {
  await verifyRoom(roomId);
  await validTicket(userId);

  const userBooking = await bookingRepository.getBooking(userId);

  if (userBooking) {
    throw cannotBookingError();
  }

  const booking = await bookingRepository.postBooking(userId, roomId);

  return booking;
}

async function putBooking(userId: number, bookingId: number, roomId: number) {
  const booking = await bookingRepository.findBooking(bookingId);

  if (!booking) {
    throw notFoundError();
  }

  if (userId !== booking.userId || roomId === booking.roomId) {
    throw cannotBookingError();
  }

  await verifyRoom(roomId);

  const resultBooking = await bookingRepository.updateBooking(bookingId, roomId);

  return resultBooking;
}

async function validateEnrollment(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if (!enrollment) {
    throw cannotBookingError();
  }

  return enrollment;
}

async function validTicket(userId: number) {
  const enrollment = await validateEnrollment(userId);

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw cannotBookingError();
  }

  return ticket;
}

async function verifyRoom(roomId: number) {
  const room = await bookingRepository.findRoom(roomId);

  if (!room) {
    throw notFoundError();
  }

  const bookingRoom = await bookingRepository.countBookingRoom(roomId);

  if (bookingRoom >= room.capacity) {
    throw cannotBookingError();
  }

  return bookingRoom;
}

const bookingService = {
  getBooking,
  postBooking,
  putBooking,
};

export default bookingService;
