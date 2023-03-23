import { CategoryObject } from './category';
import { TagObject } from './tag';
import { UserObjectSlim } from './user';
import { PostObjectPartial } from './post';

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
  mainPost?: PostObjectPartial;
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
  postcount?: number;
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
  postcount: number;
  viewcount: string;
  postercount: string;
  scheduled: string;
  deleted: string;
  deleterUid: string;
  titleRaw: string;
  locked: string;
  pinned: number;
  resolve: boolean;
  privateTopic: boolean;
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

export interface TopicAndPostData {
  topicData?: TopicObject;
  postData?: PostObjectPartial;
}

export interface TopicFields {
  markAsUnreadForAll: (tid: number) => Promise<void>;
  markAsRead: (tids: number[], uid: number | string) => Promise<void>;
  getTopicFields: (tid: number, fields: string[]) => Promise<TopicObject | null>;
  addParentPosts: (postData: PostObjectPartial[]) => Promise<void>;
  syncBacklinks: (postData: PostObjectPartial) => Promise<void>;
  create: (data: TopicData) => Promise<number>;
  createTags: (tags: string | undefined[] | TagObject[], tid: number, timestamp: number) => Promise<void>;
  scheduled: any;
  post: (data: TopicData) => Promise<TopicAndPostData>;
  checkTitle: (title: string) => void;
  validateTags: (tags: string | undefined[] | TagObject[], cid: number, uid: number | string) => Promise<void>;
  filterTags: (tags: string | undefined[] | TagObject[], cid: number) => Promise<string | undefined[] | TagObject[]>;
  checkContent: (content: string) => void;
  getTopicsByTids: (tids: number[], uid: number | string) => Promise<TopicObject[] | null>;
  follow: (tid: number, uid: number | string) => Promise<void>;
  delete: (tid: number) => Promise<void>;
  reply: (data: TopicData) => Promise<PostObjectPartial>;
  getTopicData: (tid: number) => Promise<TopicObject | null>;
  notifyFollowers: (postData: PostObjectPartial, uid: number | string, obj: {
    type: string,
    bodyShort: string,
    nid: string,
    mergeId: string,
  }) => void;
}
