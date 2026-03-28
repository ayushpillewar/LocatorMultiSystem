export class Location {
  latitude: number;
  longitude: number;
  insertionTimestamp: string;
  userName: string;
  userId: string;
  ttl?: number;

  constructor(
    latitude: number,
    longitude: number,
    insertionTimestamp: string,
    userName: string,
    userId: string,
    ttl?: number
  ) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.insertionTimestamp = insertionTimestamp;
    this.userName = userName;
    this.userId = userId;
    this.ttl = ttl;
  }
}

export class User {
  userId: string;
  email: string;
  subStartDate: string;
  subEndDate: string;
  insertionTimestamp: string;

  constructor(
    userId: string,
    email: string,
    subStartDate: string,
    subEndDate: string,
    insertionTimestamp: string
  ) {
    this.userId = userId;
    this.email = email;
    this.subStartDate = subStartDate;
    this.subEndDate = subEndDate;
    this.insertionTimestamp = insertionTimestamp;
  }
}

export class SubscriptionRequestBody {
  userId: string;
  subType: string;

  constructor(userId: string, subType: string) {
    this.userId = userId;
    this.subType = subType;
  }
}
