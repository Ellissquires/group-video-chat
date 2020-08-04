type User = {
  id: string,
  socketId: string,
};

type Room = {
  id: string,
  users: Array<User>,
};

export type Message = {
  text: string,
  user: User,
  timestamp: Date,
}

export {User, Room};