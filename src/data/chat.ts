import type { ImageSourcePropType } from 'react-native';

export interface ChatMessage {
  id: string;
  senderId: string; // 'me' or creatorId
  receiverId: string;
  text: string;
  createdAt: number;
  timeLabel: string;
  type?: 'text' | 'image' | 'video_share';
  videoTitle?: string;
  videoCover?: ImageSourcePropType;
}

/** 预置的初始私信消息 */
export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  u4: [
    {
      id: 'm-u4-1',
      senderId: 'u4',
      receiverId: 'me',
      text: '哈喽！看到你在我视频下面的留言啦 😊',
      createdAt: Date.now() - 3600000 * 2,
      timeLabel: '2小时前',
    },
    {
      id: 'm-u4-2',
      senderId: 'me',
      receiverId: 'u4',
      text: '哈哈，你家两只橘猫真的太可爱了，每次看都能被治愈！',
      createdAt: Date.now() - 3600000 * 1.5,
      timeLabel: '1.5小时前',
    },
    {
      id: 'm-u4-3',
      senderId: 'u4',
      receiverId: 'me',
      text: '谢谢你喜欢我家猫！它今天又胖了 0.2 斤',
      createdAt: Date.now() - 60000,
      timeLabel: '刚刚',
    },
  ],
  u1: [
    {
      id: 'm-u1-1',
      senderId: 'me',
      receiverId: 'u1',
      text: 'Leo老师好，请问昨天那个蓝调天台机位在哪个区呀？',
      createdAt: Date.now() - 3600000 * 4,
      timeLabel: '4小时前',
    },
    {
      id: 'm-u1-2',
      senderId: 'u1',
      receiverId: 'me',
      text: '天台的位置发你了，记得带三脚架，风比较大注意保暖！',
      createdAt: Date.now() - 720000,
      timeLabel: '12分钟前',
    },
  ],
  u2: [
    {
      id: 'm-u2-1',
      senderId: 'u2',
      receiverId: 'me',
      text: '[视频] 海边日落 · 完整版',
      createdAt: Date.now() - 3600000,
      timeLabel: '1小时前',
      type: 'text',
    },
  ],
  u7: [
    {
      id: 'm-u7-1',
      senderId: 'u7',
      receiverId: 'me',
      text: '那家面馆我再去一次，要不要一起',
      createdAt: Date.now() - 3600000 * 3,
      timeLabel: '3小时前',
    },
  ],
  u5: [
    {
      id: 'm-u5-1',
      senderId: 'u5',
      receiverId: 'me',
      text: '训练计划发你了，先练两周看看，核心一定要收紧！',
      createdAt: Date.now() - 86400000,
      timeLabel: '昨天',
    },
  ],
  u8: [
    {
      id: 'm-u8-1',
      senderId: 'u8',
      receiverId: 'me',
      text: '大理的客栈我住的那家，很安静，推荐给你！',
      createdAt: Date.now() - 86400000,
      timeLabel: '昨天',
    },
  ],
  u6: [
    {
      id: 'm-u6-1',
      senderId: 'u6',
      receiverId: 'me',
      text: '这个 bug 我复现了，是缓存没清，重启一下开发服务试试。',
      createdAt: Date.now() - 86400000 * 2,
      timeLabel: '星期二',
    },
  ],
  u3: [
    {
      id: 'm-u3-1',
      senderId: 'u3',
      receiverId: 'me',
      text: '豆子给你留了一包，浅烘的耶加雪菲，风味很足。',
      createdAt: Date.now() - 86400000 * 5,
      timeLabel: '上周',
    },
  ],
};

/** 模拟创作者根据自身人设的自动回复池 */
export const CREATOR_AUTOREPLIES: Record<string, string[]> = {
  u1: [
    '收到！今晚我要去另一个天台拍延时摄影，到时剪出来第一个发你看！📷',
    '拍夜景最重要的就是曝光锁定，多试几次就有感觉了。',
    '赞！祝你也能拍出大片！',
  ],
  u2: [
    '日落真的很美，明天海边见！🌊',
    '正在剪辑下一期大理洱海的慢直播，记得来看哦！',
    '旅行最迷人的地方就是未知的风景，出发永远是最有意义的事。',
  ],
  u3: [
    '慢下来，感受风、咖啡和时间的声音。☕',
    '新烘焙的一批豆子养豆差不多了，明天冲一杯试试！',
    '祝你今天也有好心情！',
  ],
  u4: [
    '喵呜~ 刚刚在给大橘开罐头呢！罐头一响它就飞奔过来了 🐱',
    '小橘今天学会了新技能：把自己塞进比它小一半的快递盒里哈哈！',
    '猫猫已接收到你的喜爱，它冲着屏幕眨了眨眼睛~',
  ],
  u5: [
    '今天练了吗？别偷懒哦，坚持 21 天就会看到线条的变化！💪',
    '动作要慢、感觉要准，饮食保持高蛋白清淡饮食。',
    '加油！每一次力竭都是新的突破！',
  ],
  u6: [
    '刚 push 了一版新代码，总算把那个诡异的 bug 给修好了 🎉',
    '深夜敲代码最有灵感，但也别忘了早点休息。',
    '代码如人生，写得清晰，跑得从容！',
  ],
  u7: [
    '哈哈，那家店的牛肉面真的绝了，汤底熬了 8 个小时！🍜',
    '周末我再去挖一家藏在巷子里的老广糖水铺，到时候测评发出来！',
    '没有什么是一顿美食解决不了的，如果有，那就两顿！',
  ],
  u8: [
    '路上风景太壮阔了，有时候没信号，等我回到驿站再跟你细聊！🎒',
    '背包旅行第七年，依然热爱这片土地的每一寸阳光。',
    '期待在旅途中偶遇！',
  ],
};

/** 社交通知数据（新粉丝、赞、@我的、评论） */
export interface NotificationItem {
  id: string;
  type: 'fan' | 'like' | 'mention' | 'comment';
  creatorId: string;
  timeLabel: string;
  content: string;
  quote?: string;
  followed?: boolean;
}

export const SOCIAL_NOTIFICATIONS: Record<'fan' | 'like' | 'mention' | 'comment', NotificationItem[]> = {
  fan: [
    { id: 'f1', type: 'fan', creatorId: 'u1', timeLabel: '10分钟前', content: '关注了你' },
    { id: 'f2', type: 'fan', creatorId: 'u4', timeLabel: '1小时前', content: '关注了你' },
    { id: 'f3', type: 'fan', creatorId: 'u7', timeLabel: '昨天', content: '关注了你' },
    { id: 'f4', type: 'fan', creatorId: 'u2', timeLabel: '3天前', content: '关注了你' },
  ],
  like: [
    { id: 'l1', type: 'like', creatorId: 'u2', timeLabel: '5分钟前', content: '赞了你的作品', quote: '《记录一下，随便拍拍》' },
    { id: 'l2', type: 'like', creatorId: 'u3', timeLabel: '30分钟前', content: '赞了你的评论', quote: '“慢不是速度，是注意力”' },
    { id: 'l3', type: 'like', creatorId: 'u5', timeLabel: '2小时前', content: '赞了你的作品', quote: '《夜跑 5 公里打卡》' },
  ],
  mention: [
    { id: 'm1', type: 'mention', creatorId: 'u6', timeLabel: '20分钟前', content: '在评论中提到了你', quote: '@小怂猪 快来看看这段实现太妙了' },
    { id: 'm2', type: 'mention', creatorId: 'u8', timeLabel: '昨天', content: '在作品中提到了你', quote: '下一站目的地分享 @小怂猪' },
  ],
  comment: [
    { id: 'c1', type: 'comment', creatorId: 'u4', timeLabel: '刚刚', content: '回复了你的评论', quote: '“下次带小猫一起出镜！”' },
    { id: 'c2', type: 'comment', creatorId: 'u7', timeLabel: '1小时前', content: '评论了你的作品', quote: '“这个色调调得很有胶片感啊”' },
  ],
};
