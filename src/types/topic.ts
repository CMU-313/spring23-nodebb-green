import { CategoryObject } from './category';
import { TagObject } from './tag';
import { UserObjectSlim } from './user';

export type TopicObject =
    TopicObjectSlim & TopicObjectCoreProperties & TopicObjectOptionalProperties;

export type TopicObjectCoreProperties = {
  lastposttime: number;
  category: CategoryObject;
  user: UserObjectSlim;
  teaser: Teaser;
  tags: TagObject[];
  isOwner: boolean;
  ignored: boolean;
  unread: boolean;
  bookmark: number;
  unreplied: boolean;
  icons: string[];
};

export type TopicData = {
  tid?: number;
  uid?: number | string;
  cid?: number;
  mainPid?: number;
  title?: string;
  slug?: string;
  timestamp?: number;
  lastposttime?: number | string;
  postcount?: number | string;
  viewcount?: number | string;
  resolve: boolean;
  privateTopic: boolean;
  tags?: string | undefined[] | TagObject[];
  content?: string;
  fromQueue?: boolean;
  req?: Request;
  ip?: number;
  handle?: string;
}

export type Request = {
  ip?: number;
}

export type TopicObjectOptionalProperties = {
  tid: number;
  thumb: string;
  pinExpiry: number;
  pinExpiryISO: string;
  index: number;
};

interface Teaser {
  pid: number;
  uid: number | string;
  timestamp: number;
  tid: number;
  content: string;
  timestampISO: string;
  user: UserObjectSlim;
  index: number;
}

export type TopicObjectSlim = TopicSlimProperties & TopicSlimOptionalProperties;

export type TopicSlimProperties = {
  tid: number;
  uid: number | string;
  cid: number;
  title: string;
  slug: string;
  mainPid: number;
  postcount: string;
  viewcount: string;
  postercount: string;
  scheduled: string;
  deleted: string;
  deleterUid: string;
  titleRaw: string;
  locked: string;
  pinned: number;
  timestamp: string;
  timestampISO: number;
  lastposttime: string;
  lastposttimeISO: number;
  pinExpiry: number;
  pinExpiryISO: number;
  upvotes: string;
  downvotes: string;
  votes: string;
  teaserPid: number | string;
  thumbs: Thumb[];
};

export type Thumb = {
  id: number;
  name: string;
  url: string;
};

export type TopicSlimOptionalProperties = {
  tid: number;
  numThumbs: number;
};
