# 音乐作品总录 · 专辑与原创曲

> **本文档是「神椿工作室到底发行了什么歌」的考据底账**：把 V.W.P 等组合与神椿各成员公开的**专辑、EP、单曲与原创曲**逐条登记，供写代码、写剧情、写 i18n 词条时查证。
> **采集时点：2026-10-18。**
> **三个来源互为校对**：① **KAMITSUBAKI STUDIO 官方 DISCOGRAPHY**（462 条商品/配信记录）为**日期与版本的基准**；② **网易云音乐艺人页**（艺人 discography，补官方列表漏项）；③ **萌娘百科逐曲表**（补「原创曲投稿」维度）。
> 分类、日文表记均按原来源转录，未做中文化改写。

---

## 0. 阅读指南（口径与出处等级）

### 0.1 三条口径

| # | 口径 | 说明 |
|---|---|---|
| 1 | **「发行」与「原创曲」是两个维度** | 「发行」＝一条商品/配信（同曲多版本各占一条）；「原创曲」＝该艺人**首次公开的原创歌**（Remix、Live Ver.、Rearranged 不另计新原创曲） |
| 2 | **日期以来源原样登记** | 官方取「发行日」、平台取「上架日」、萌百取「投稿日」。**平台日期常比官方早 1 天**（时区/零点换算），冲突时**以官方为准**（见 §7.3） |
| 3 | **多版本分别列** | α／β／γ、type-W／type-B、覚醒 ver.／深脊界 ver.、通常盤／初回限定盤等，只要来源算作不同发行就分行；曲目相同的在备注写明 |

### 0.2 出处等级（沿用 [README.md](README.md) 铁律 1）

| 标记 | 含义 |
|---|---|
| **【官方】** | kamitsubaki.jp 的 DISCOGRAPHY／艺人页／NEWS 原文 |
| **【官方二次】** | 官方转述（动画官网音乐页、商品页文案等） |
| **【平台】** | 网易云音乐艺人 discography 元数据（QQ 音乐／哔哩哔哩同口径，可作第二平台复核） |
| **【粉丝wiki】** | 萌娘百科逐曲表（CC BY-NC-SA 4.0，**不可商用**，也**不能当官方设定引用**） |
| **【本仓库考据】** | 本仓库 `docs/lore/research/` 已收录并标过源的材料 |

> ★ **本文档不新造任何设定。** 曲名、日期、版本名照抄；推不出结论的写「未取得」，不补全、不猜测。

---

## 1. 一页统计

> **「官方条目」**＝官方 DISCOGRAPHY 中属于该主体的行数（同作品多版本分别计）；**「平台条目」**＝网易云艺人页的发行总数（含单曲，数值明显偏大，因其把每张配信单曲都算一条）；**「原创曲」**＝萌百逐曲表去重后的条数（含合唱/合作）。

| 主体 | 定位 | 官方条目 | 其中专辑类 | 平台条目 | 原创曲 |
|---|---|---|---|---|---|
| **V.W.P** | 五人组合 | 17 | 1（另有《反転》《覚醒》《繁殖》见 §2.2） | 38 | 28 |
| **花譜** | 成员 | 46 | 16 | 72 | 77 |
| **理芽** | 成员 | 30 | 5 | 48 | 29 |
| **春猿火** | 成员 | 37 | 9 | 48 | 22 |
| **ヰ世界情緒** | 成员 | 35 | 9 | 64 | 50 |
| **幸祜** | 成员 | 14 | 4 | 38 | 26 |
| **心世紀** | 少革组合 | 29 | 1 | 8 | 未取得逐曲表 |
| **罪十罰** | 少革组合 | 28 | 1 | 7 | 未取得逐曲表 |
| **VALIS** | 深脊界组合 | 28 | 0（专辑未进官方列表） | 41 | 22 |
| **CIEL** | 成员 | 3 | 0 | 32 | 9 |
| **明透** | 成员 | 25 | 0 | 43 | 24 |
| **存流** | 成员（已毕业） | 7 | 0 | 12 | 10 |
| **琶舞** | 成员 | 7 | 0 | 13 | 4 |
| **空爽** | CIEL×Sooda | 0（未进官方列表） | 0 | 4 | 未取得逐曲表 |

**几个一眼可见的事实**

- **花譜的发行量最大**：官方 46 条、平台 72 条；专辑多为 **α／β／γ 三版本**（α／β 曲目相同、封面特典不同，γ 为全曲 Remix）。
- **V.W.P 的曲目有官方三分类**（系譜曲／派生曲／拡声曲），见 §2.2——**官方定义，不是粉丝归纳**。
- **ヰ世界情緒的原创曲最多**（50 条），集中在 2020 年「物語りのワルツ」期。
- **近两年供曲最密的是少革两团**：心世紀 29 条＋罪十罰 28 条（含两团**共用的合作发行**，同一张会在两列各计一次，**故不能简单相加**）。
- **官方列表会漏**：V.W.P 的《反転》《覚醒》《繁殖》、花譜《深愛》、VALIS 全部专辑、空爽《CYAN》都**不在官方 DISCOGRAPHY 列表里**，必须用平台数据补（见各节「平台补录」）；**明透／存流／琶舞／CIEL 的专辑**也几乎全在平台侧（官方只列单曲），见 §3.6–3.9。

---

## 2. V.W.P -Virtual Witch Phenomenon-

### 2.1 官方定义

- 官方定位：「花譜、理芽、春猿火、ヰ世界情緒、幸祜ら5人の**電脳の魔女達**が結集した、バーチャルアーティストグループ。」【官方】
- **乐曲三分类（官方原文）**【官方】：
  | 分类 | 官方定义 | 本文登记 |
  |---|---|---|
  | **系譜曲** | 「初期の代表曲「魔女」に連なる**カンザキイオリ**が作詞・作曲を手がける楽曲群」 | 12 条（去重后 11 首） |
  | **派生曲** | 「グループ内で**ペアを組み替えながら歌う**曲」 | 7 条 |
  | **拡声曲** | 「5人が**新たなコンポーザー達と織りなす**曲」 | 9 条 |
- 现状：**2026 年 3 月末起进入充电期「INTERVAL」**，目标在「魔女再誕」时再集结。【官方】

### 2.2 专辑

| 发行日 | 标题 | 官方/平台 | 曲数 | 曲目或备注 | 出处 |
|---|---|---|---|---|---|
| 2023-08-21 | 運命 | 1st Album | 15 | 開幕（Instrumental）／魔女／共鳴／電脳／祭壇／秘密／言霊／玩具／宣戦／定命／変身／輪廻／再会／魔女（真）／仮想（Instrumental） | 【官方】[详情页](https://kamitsubaki.jp/discography/v-w-p/3082/) |
| 2024-03-26 | 覚醒 | 专辑 | 15 | 曲目未取得 | 【平台】 |
| 2025-03-25 | 繁殖 | 专辑 | 20 | 曲目未取得 | 【平台】 |
| 2026-01-21（平台 01-20） | 反転 | 3rd Album | 15 | OP Instrumental／真偽／反逆／流転／神話／決意／点灯／追憶／歌姫／愛詩／？？？（发售时未公开）／終点／言葉／命海／ED Instrumental | 【官方】[NEWS](https://kamitsubaki.jp/news/2025/10/18/8803/) |

- **《運命》**：13 曲＋OP/ED 两首 Instrumental；CD 2023-08-21、数字 2023-08-23。【官方】
- **《反転》**：官方称「約1年半振りとなるフルアルバム」，初回限定盤分**五种成员封面**，附 mini live『拡張前夜』Blu-ray；第 11 曲发售时写作「？？？」未公开。【官方】
- ⚠️ **编号矛盾（重要）**：官方把《反転》称作 **3rd ALBUM**，但官方 DISCOGRAPHY 只列了 1st《運命》；平台另有《覚醒》（2024）与《繁殖》（2025）两张「专辑」。**三者谁是「2nd」无法从官方文本确认**——本文并排列出，**不做判定**。若引用「V.W.P 有几张专辑」，请写「官方列表 1 张＋NEWS 补 1 张＋平台 2 张，编号待考」。

### 2.3 平台补录（不在官方 DISCOGRAPHY 的 EP/单曲）

| 平台日期 | 标题 | 曲数 | 平台类型 |
|---|---|---|---|
| 2025-12-18 | 都市II from 神椿市建設中。VIRTUAL REALITY | 5 | EP |
| 2025-07-29 | 歌姫 | 4 | EP |
| 2025-06-10 | 魔女ぷらす2 | 6 | EP |
| 2025-04-10 | 都市 from 神椿市建設中。REGENERATE | 5 | EP |
| 2025-01-14 | 魔女ぷらす | 5 | EP |

> 平台另有动画/游戏 EP：《歌姫》（2025-07-29，4 曲）、《都市 from 神椿市建設中。REGENERATE》（2025-04-10，5 曲）、《都市II from VIRTUAL REALITY》（2025-12-18，5 曲）、《魔女ぷらす》《魔女ぷらす2》，与 §2.8、§5.3 对应。

### 2.4 系譜曲（カンザキイオリ 作词作曲）

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2021-03-21 | 魔女(真) | 系谱曲 |
| 2021-06-20 | 電脳 | 系谱曲 |
| 2021-11-03 | 輪廻 | 系谱曲 |
| 2021-11-18 | 変身 (The Metamorphosis) | 系谱曲 |
| 2022-01-21 | 言霊 | 系谱曲 |
| 2022-07-27 | 共鳴 | 系谱曲 |
| 2022-12-21 | 再会 | 系谱曲 |
| 2023-05-25 | 魔女(真) （Original MV） | 系谱曲 |
| 2023-06-17 | 定命 | 系谱曲 |
| 2023-07-12 | 玩具 | 系谱曲 |
| 2023-08-23 | 祭壇 | 系谱曲 |
| 2023-11-08 | 秘密 | 系谱曲 |

> 注：「魔女(真)」出现两次（2021 初版 MV、2023 Original MV），**同一首歌**；去重后系譜曲实为 **11 首**。

### 2.5 拡声曲

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2023-08-02 | 飛翔 | 拡声曲 |
| 2024-01-06 | 感情 | 拡声曲 |
| 2024-01-16 | 切札 | 拡声曲 |
| 2024-03-06 | 同盟 | 拡声曲 |
| 2024-03-27 | 花束 | 拡声曲 |
| 2024-05-23 | 未遂 | 拡声曲 |
| 2024-06-29 | 強気 | 拡声曲 |
| 2024-08-29 | 暁光 | 拡声曲 |
| 2025-02-26 | 真偽 | 拡声曲 |

### 2.6 派生曲（组内换对唱）

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2020-11-24 | まほう feat. 理芽 【不可解弐Q1Live Ver.】 | 派生曲 |
| 2021-06-18 | ヰ世界情緒 × 花譜 深淵 | 派生曲 |
| 2021-10-23 | 春猿火 × ヰ世界情緒 牢獄 | 派生曲 |
| 2021-10-23 | ヰ世界情緒 × 花譜 暗闇 | 派生曲 |
| 2021-10-23 | ヰ世界情緒 × 幸祜 刻印 | 派生曲 |
| 2021-10-23 | 理芽 × ヰ世界情緒 泡沫 | 派生曲 |
| 2022-10-16 | 春猿火 × 幸祜 古傷 | 派生曲 |

### 2.7 官方单曲序列（DISCOGRAPHY）

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2021-06-16 | [電脳](https://kamitsubaki.jp/discography/v-w-p/390/) | 1st Single |
| 2021-11-03 | [輪廻](https://kamitsubaki.jp/discography/v-w-p/976/) | 2nd Single |
| 2021-11-17 | [変身](https://kamitsubaki.jp/discography/v-w-p/977/) | 3rd Digital Single |
| 2022-01-21 | [言霊](https://kamitsubaki.jp/discography/v-w-p/1097/) | 4th Single |
| 2022-07-27 | [共鳴](https://kamitsubaki.jp/discography/v-w-p/1602/) | 5th Single |
| 2022-10-04 | [輪廻 acoustic ver.](https://kamitsubaki.jp/discography/v-w-p/1971/) | 6th Single |
| 2022-12-21 | [再会](https://kamitsubaki.jp/discography/v-w-p/1973/) | 7th Single |
| 2023-05-24 | [魔女(真)](https://kamitsubaki.jp/discography/v-w-p/2006/) | 8th Single |
| 2023-06-27 | [定命](https://kamitsubaki.jp/discography/v-w-p/2767/) | 9th Single |
| 2023-07-12 | [玩具](https://kamitsubaki.jp/discography/v-w-p/3058/) | 10th Single |
| 2023-08-02 | [飛翔](https://kamitsubaki.jp/discography/v-w-p/3060/) | 11th Single |
| 2023-08-16 | [祭壇](https://kamitsubaki.jp/discography/v-w-p/3062/) | 12th Single |
| 2023-10-11 | [秘密](https://kamitsubaki.jp/discography/v-w-p/3084/) | 13th Single |
| 2023-12-30 | [感情](https://kamitsubaki.jp/discography/v-w-p/3085/) | 14th Single |
| 2024-01-13 | [切札](https://kamitsubaki.jp/discography/v-w-p/3086/) | 15th Single |
| 2024-03-06 | [同盟](https://kamitsubaki.jp/discography/v-w-p/3219/) | 16th Single |

### 2.8 动画／影片相关曲（未进 DISCOGRAPHY，单独补记）

| 曲名 | 担当 | 用途 | 出处 |
|---|---|---|---|
| 歌姫 | V.W.P | TV 动画《神椿市建設中。》OP；单曲 2025-07-30（KTR-201） | 【官方二次】动画官网音乐页 |
| 追憶 | V.W.P | 同动画 ED；收录于《歌姫》单曲与《反転》 | 【官方二次】 |
| 欲望 | V.W.P | 动画第 9 话曲；收录《仮想都市録》DISC1 | 【本仓库考据】 |
| 電脳 sinka ver. | V.W.P | 动画第 10 话版；另有《魔女（真）sinka ver.》《同盟 sinka ver.》 | 【官方】乐曲集曲名 |
| 愛詩 | V.W.P | TV 动画《未ル わたしのみらい》OP；收录《反転》 | 【官方】NEWS 原文 |

### 2.9 与本作的关系

- **派生曲＝官方认证的「两两换唱」**，与本作「魔女之子组队/共鸣」天然同构，可直接作为组队演出素材（引用标【官方】）。
- 「現象」是 **LIVE 系列标题**（現象Ⅰ〜Ⅳ），**不是曲名**——本仓库曾误记，使用前注意。

---

## 3.1 花譜（かふ／KAFU）

神椿最早的虚拟歌手（2018-10 开始活动）。原创曲绝大多数由 **カンザキイオリ** 提供（2024 年从神椿毕业），此后转为 PIEDPIPER 选定的多作曲家体制；**2026-05-26 发行 5th Album《深愛》**（平台数据）。

### 专辑／EP（官方 DISCOGRAPHY）

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2019-05-15 | [花と心臓](https://kamitsubaki.jp/discography/kaf/335/) | 1st EP |
| 2019-09-11 | [観測β](https://kamitsubaki.jp/discography/kaf/338/) | 1st Album |
| 2019-09-11 | [観測α](https://kamitsubaki.jp/discography/kaf/337/) | 1st Album |
| 2019-12-25 | [観測γ](https://kamitsubaki.jp/discography/kaf/340/) | Remix Album |
| 2020-07-22 | [花と解答-ブラッククローバー Edition-](https://kamitsubaki.jp/discography/kaf/356/) | 2nd EP |
| 2020-07-22 | [花と解答-オリジナルEdition-](https://kamitsubaki.jp/discography/kaf/354/) | 2nd EP |
| 2020-08-19 | [I SCREAM LIVE](https://kamitsubaki.jp/discography/kaf/357/) | Cover Live Album |
| 2020-11-25 | [魔法β](https://kamitsubaki.jp/discography/kaf/367/) | 2nd Album |
| 2020-11-25 | [魔法α](https://kamitsubaki.jp/discography/kaf/366/) | 2nd Album |
| 2021-12-22 | [魔法γ](https://kamitsubaki.jp/discography/kaf/1037/) | Remix Album |
| 2023-03-08 | [狂想β](https://kamitsubaki.jp/discography/kaf/1950/) | 3rd Album |
| 2023-03-08 | [狂想α](https://kamitsubaki.jp/discography/kaf/1948/) | 3rd Album |
| 2024-03-19 | [組曲](https://kamitsubaki.jp/discography/kaf/3330/) | Collaboration Album |
| 2024-03-27 | [狂想γ](https://kamitsubaki.jp/discography/kaf/3333/) | Remix Album |
| 2024-05-22 | [GSA](https://kamitsubaki.jp/discography/kaf/3813/) | E.P. |
| 2024-12-25 | [花譜「寓話」](https://kamitsubaki.jp/discography/kaf/5114/) | 4th Album |

### 平台补录（官方**专辑**列表之外的专辑/EP，含翻唱与 Remix，【平台】）

| 平台日期 | 标题 | 曲数 | 平台类型 |
|---|---|---|---|
| 2026-05-26 | 深愛 | 15 | 专辑 |
| 2026-01-13 | I SCREAM LIVE4 - Cover Live Album - | 20 | 专辑 |
| 2025-07-15 | 寓話γ | 13 | 专辑 |
| 2024-10-29 | I SCREAM LIVE3 | 21 | 专辑 |
| 2023-09-26 | I SCREAM LIVE2 | 31 | 专辑 |
| 2020-10-06 | 愛と花 | 4 | EP |
| 2020-06-30 | 戸惑いテレパシー | 5 | EP |
| 2019-06-27 | 夜が降り止む前に | 4 | EP |

> **口径提醒**：官方类型（Single／EP／Album）与萌百「迷你专辑/EP」口径不一致时，**一律以官方类型为准**，本文不合并；平台另有翻唱单曲时也已剔除。

### 原创曲

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2018-12-06 | 糸 |  |
| 2018-12-28 | 心臓と絡繰 |  |
| 2019-01-09 | 魔女 |  |
| 2019-01-31 | 忘れてしまえ |  |
| 2019-03-22 | 雛鳥 |  |
| 2019-06-05 | 過去を喰らう |  |
| 2019-06-28 | 夜が降り止む前に |  |
| 2019-08-01 | 祭壇 |  |
| 2019-08-01 | そして花になる |  |
| 2019-08-06 | quiz |  |
| 2019-08-14 | 夜行バスにて |  |
| 2019-09-07 | 命に嫌われている （Prayer Ver.） |  |
| 2019-09-12 | 不可解 |  |
| 2019-09-17 | Re:HEROINES |  |
| 2019-09-24 | エリカ |  |
| 2019-11-27 | 死んでしまったのだろうか (2nd Ver.) feat. 花譜 |  |
| 2019-12-20 | 未確認少女進行形 |  |
| 2020-01-08 | 私論理 |  |
| 2020-03-23 | 宣戦 feat. 理芽 | 合唱曲 |
| 2020-05-11 | 危ノーマル |  |
| 2020-06-08 | 戸惑いテレパシー |  |
| 2020-07-08 | アンサー |  |
| 2020-07-22 | 景色 |  |
| 2020-08-13 | 畢生よ |  |
| 2020-09-07 | Kizuna AI × 花谱 ラブしい | 合作曲 |
| 2020-09-23 | Kizuna AI × 花谱 かりそめ | 合作曲 |
| 2020-10-18 | 彷徨い |  |
| 2020-11-18 | メルの黄昏 |  |
| 2020-11-24 | 花女 |  |
| 2020-11-24 | 痛みを |  |
| 2020-11-24 | モンタージュ |  |
| 2020-11-24 | 帰り路 |  |
| 2020-11-24 | まほう feat. 理芽 【不可解弐Q1Live Ver.】 | 合唱曲 |
| 2020-12-30 | 雛鳥 with ヰ世界情緒 【不可解弐Q1Live Ver.】 | 合唱曲 |
| 2021-01-03 | 命に嫌われている。 with 春猿火 【不可解弐Q1Live Ver.】 | 合唱曲 |
| 2021-03-18 | ソレカラ |  |
| 2021-03-24 | アイスクリーム feat. 花譜 |  |
| 2021-05-19 | 例えば |  |
| 2021-06-12 | 未観測 |  |
| 2021-06-12 | 朝日 feat. 可不 | 合唱曲 |
| 2021-06-30 | 海に化ける |  |
| 2021-07-11 | 不埒な喝采 feat. 可不 | 合唱曲 |
| 2021-10-14 | 世惑い子 |  |
| 2021-10-20 | ニヒル |  |
| 2021-10-27 | GLIM SPANKY × 花谱 鏡よ鏡 | 合作曲 |
| 2021-11-17 | 大森靖子 × 花谱 イマジナリーフレンド | 合作曲 |
| 2021-11-30 | それを世界と言うんだね |  |
| 2021-12-08 | 佐倉綾音 × 花谱 あさひ | 合作曲 |
| 2021-12-13 | 抜刀 feat. 花譜 |  |
| 2022-01-19 | たなか × 花谱 飛翔するmeme | 合作曲 |
| 2022-02-23 | 羽生まゐご × 花谱 わたしの線香 | 合作曲 |
| 2022-03-25 | くじら × 花谱 春陽 | 合作曲 |
| 2022-04-20 | 长谷川白纸 × 花谱 蕾に雷 | 合作曲 |
| 2022-05-11 | MIYAVI × 花谱 Beyond META | 合作曲 |
| 2022-05-16 | VALIS × 花谱 神聖革命バーチャルリアリティ | 合作曲 |
| 2022-07-13 | 可不 × 花谱 (Prod.HiFi-P) 流線形メーデー | 合作曲 |
| 2022-07-15 | 暗闇 with ヰ世界情緒 | 合唱曲 |
| 2022-10-12 | ORESAMA × 花谱 CAN-VERSE | 合作曲 |
| 2023-01-03 | 人を気取る |  |
| 2023-03-18 | 东京ゲゲゲイ × 花谱 メイドインあたし | 合作曲 |
| 2023-04-05 | ズーカラデル × 花谱 秘密の言叶 | 合作曲 |
| 2023-05-03 | 邂逅 |  |
| 2023-07-05 | ケンモチヒデフミ × 花譜 しゅげーハイ!!! | 合作曲 |
| 2024-01-03 | 岸田繁 × 花譜 愛のまま | 合作曲 |
| 2024-02-28 | #KTちゃん × 花譜 ギミギミ逃避行feat. #KTちゃん(Prod. peko) | 合作曲 |
| 2024-05-22 | ゲシュタルト |  |
| 2024-06-12 | 崎山蒼志 × 花譜 抱きしめて | 合作曲 |
| 2024-07-14 | ゲシュタルト-崩壊Remix- |  |
| 2024-08-21 | ツミキ × 花譜 チューイン・ディスコ | 合作曲 |
| 2024-11-27 | 星街すいせい × 花譜 一世風靡 | 合作曲 |
| 2024-11-29 | Moe Shop × 花譜 My Life | 合作曲 |
| 2024-12-25 | アポカリプスより |  |
| 2025-03-05 | 代替嬉々 |  |
| 2025-04-14 | 明滅 |  |
| 2025-07-02 | CHiCO × 花譜 撃って | 合作曲 |
| 2025-08-20 | ひとえに壊れて |  |
| 2025-09-03 | Mori Calliope × 花譜 光 | 合作曲 |

## 3.2 理芽（りめ／RIM）

2019-10 出道，设定上是花譜的姐姐。原创曲几乎全部由 **笹川真生** 提供，是五人中作曲家最集中的一位。

### 专辑／EP（官方 DISCOGRAPHY）

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2021-03-24 | [CHOCOLATE LIVE](https://kamitsubaki.jp/discography/rim/379/) | Cover Live Album |
| 2021-07-21 | [NEW ROMANCER](https://kamitsubaki.jp/discography/rim/703/) | 1st Album |
| 2023-09-20 | [imagine](https://kamitsubaki.jp/discography/guiano/2646/) | Album |
| 2023-12-06 | [NEW ROMANCER2](https://kamitsubaki.jp/discography/rim/2863/) | Album |
| 2024-02-14 | [CHOCOLATE LIVE2](https://kamitsubaki.jp/discography/rim/3170/) | Cover Live Album |

### 平台补录（官方**专辑**列表之外的专辑/EP，含翻唱与 Remix，【平台】）

| 平台日期 | 标题 | 曲数 | 平台类型 |
|---|---|---|---|
| 2026-04-28 | CHOCOLATE LIVE4 | 20 | 专辑 |
| 2025-04-22 | CHOCOLATE LIVE3 | 22 | 专辑 |
| 2022-11-27 | Singularity Live | 25 | 专辑 |

> **口径提醒**：官方类型（Single／EP／Album）与萌百「迷你专辑/EP」口径不一致时，**一律以官方类型为准**，本文不合并；平台另有翻唱单曲时也已剔除。

### 原创曲

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2019-12-20 | ユーエンミー / You & Me |  |
| 2020-01-03 | 食虫植物 / Carnivorous Plant |  |
| 2020-02-04 | ピロウトーク / Pillow Talk |  |
| 2020-02-27 | Flowering (with Misumi) |  |
| 2020-03-23 | 花譜 × 理芽 宣戦 | 合唱曲 |
| 2020-04-10 | Guiano × 理芽 透過夏 (feat.RIM) / I Think Of Summer (feat.RIM) | 合唱曲 |
| 2020-07-01 | クライベイビー / Cry Baby |  |
| 2020-10-28 | 甘美な無法 / Luscious Lawless |  |
| 2020-11-24 | 花譜 × 理芽 まほう 【不可解弐Q1Live Ver.】 | 合唱曲 |
| 2021-01-20 | 法螺話 (with Guiano) / Tall Story (with Guiano) |  |
| 2021-02-28 | いたいよ |  |
| 2021-04-28 | 胎児に月はキスをしない |  |
| 2021-05-15 | さみしいひと |  |
| 2021-05-15 | ラヴソング |  |
| 2021-05-15 | 宿木 |  |
| 2021-05-15 | NEUROMANCE |  |
| 2021-05-15 | やさしくしないで |  |
| 2021-05-15 | 魔的 feat. 花譜 | 合唱曲 |
| 2021-06-09 | 十九月 |  |
| 2021-07-24 | やさしくしないで / Don't be Kind to Me |  |
| 2021-10-20 | あおいこわす |  |
| 2021-10-20 | あまくてあかくて |  |
| 2021-10-20 | Is it Pain, Love or Death? |  |
| 2022-10-05 | インナアチャイルド |  |
| 2023-01-17 | 狂えない /无法发狂 |  |
| 2023-08-23 | えろいむ /Eloim |  |
| 2023-08-23 | ルフラン /Re flain |  |
| 2023-08-23 | おしえてかみさま /神明大人请告诉我 |  |
| 2023-08-23 | フロム天国 /来自天国 |  |

## 3.3 春猿火（はるさるひ／HARUSARUHI）

以歌唱与说唱见长。早期由 **たかやん** 供曲，后与大沼パセリ、MILKEY 等合作；另有「自由律」诗词系列（非歌曲）。

### 专辑／EP（官方 DISCOGRAPHY）

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2021-03-17 | [CREAM PUFF LIVE](https://kamitsubaki.jp/discography/harusaruhi/378/) | Cover Live Album |
| 2021-10-06 | [心眼](https://kamitsubaki.jp/discography/harusaruhi/824/) | 1st Album |
| 2022-10-05 | [CREAM PUFF LIVE 2](https://kamitsubaki.jp/discography/harusaruhi/2773/) | Cover Live Album |
| 2023-10-18 | [CREAM PUFF LIVE 3](https://kamitsubaki.jp/discography/harusaruhi/2710/) | Cover Live Album |
| 2024-01-24 | [心獣](https://kamitsubaki.jp/discography/harusaruhi/2748/) | 2nd Album |
| 2025-02-19 | [RULE THE WORLD](https://kamitsubaki.jp/discography/harusaruhi/6054/) | 1st Mini Album |
| 2025-09-24 | [CREAM PUFF LIVE 4](https://kamitsubaki.jp/discography/harusaruhi/9649/) | Cover Live Album |
| 2026-02-18 | [SPICE OF LIFE](https://kamitsubaki.jp/discography/harusaruhi/10210/) | 春猿火 Free Verse Mix Album |
| 2026-06-24 | [GLITCH STAGE](https://kamitsubaki.jp/discography/harusaruhi/10753/) | 春猿火 Remix Album |

### 平台补录（官方**专辑**列表之外的专辑/EP，含翻唱与 Remix，【平台】）

| 平台日期 | 标题 | 曲数 | 平台类型 |
|---|---|---|---|
| 2021-03-14 | CONNECTED OVER THE DIMENSION | 7 | 专辑 |

> **口径提醒**：官方类型（Single／EP／Album）与萌百「迷你专辑/EP」口径不一致时，**一律以官方类型为准**，本文不合并；平台另有翻唱单曲时也已剔除。

### 原创曲

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2019-12-25 | 逆転 |  |
| 2020-03-06 | Lift Up |  |
| 2020-05-29 | 猛進 |  |
| 2020-07-30 | オオゴト |  |
| 2020-09-28 | 告げ口 |  |
| 2020-12-09 | 台風の眼 |  |
| 2021-01-03 | 花譜 × 春猿火 命に嫌われている。 【不可解弐Q1Live Ver.】 | 合唱曲 |
| 2021-01-27 | 居場所 |  |
| 2021-06-23 | 覚醒 feat. さなり | 合作曲 |
| 2021-08-18 | 哀愁さえも仲間 |  |
| 2021-10-20 | Gunpowder |  |
| 2021-10-20 | Pleiades |  |
| 2021-10-20 | Ambition |  |
| 2021-10-20 | 幸祜 × 春猿火 ÷ | 合唱曲 |
| 2021-10-20 | ヰ世界情緒 × 春猿火 愛厭奇縁 | 合唱曲 |
| 2021-10-23 | 春猿火 × ヰ世界情緒 牢獄 | 合唱曲 |
| 2022-03-25 | 青春 |  |
| 2022-06-29 | 百花繚乱 |  |
| 2022-09-21 | テラ |  |
| 2022-10-16 | 幸祜 × 春猿火 古傷 | 合唱曲 |
| 2022-11-16 | 自由までの距離 |  |
| 2023-05-17 | 春猿火 × ヰ世界情緒 生存 | 合唱曲 |

## 3.4 ヰ世界情緒（いせかいじょうちょう／ISEKAI JOUCHO）

自称「歌い、創ります」，原创曲投稿量在五人中最多；专辑以 **香椎モイミ** 为核心制作阵，另有はるまきごはん、柊マグネタイト、廉等参与。

### 专辑／EP（官方 DISCOGRAPHY）

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2021-03-31 | [CANDY LIVE](https://kamitsubaki.jp/discography/isekaijoucho/382/) | Cover Live Album |
| 2021-12-08 | [創生β](https://kamitsubaki.jp/discography/isekaijoucho/1081/) | 1st Album |
| 2021-12-08 | [創生α](https://kamitsubaki.jp/discography/isekaijoucho/1036/) | 1st Album |
| 2023-03-29 | [CANDY LIVE 2](https://kamitsubaki.jp/discography/isekaijoucho/1891/) | Cover Live Album |
| 2024-03-27 | [色彩β](https://kamitsubaki.jp/discography/isekaijoucho/3472/) | 2nd Album |
| 2024-03-27 | [色彩α](https://kamitsubaki.jp/discography/isekaijoucho/3471/) | 2nd Album |
| 2025-12-10 | [CANDY LIVE 3](https://kamitsubaki.jp/discography/isekaijoucho/10458/) | Cover Live Album |
| 2026-02-25 | [幻視録](https://kamitsubaki.jp/discography/isekaijoucho/10122/) | E.P. |
| 2026-03-19 | [Virtual Ties 〜ヰ世界情緒夢想曲〜 Theme Songs](https://kamitsubaki.jp/discography/isekaijoucho/11204/) | E.P. |

### 平台补录（官方**专辑**列表之外的专辑/EP，含翻唱与 Remix，【平台】）

| 平台日期 | 标题 | 曲数 | 平台类型 |
|---|---|---|---|
| 2022-11-27 | Singularity Live | 25 | 专辑 |
| 2021-03-14 | CONNECTED OVER THE DIMENSION | 7 | 专辑 |

> **口径提醒**：官方类型（Single／EP／Album）与萌百「迷你专辑/EP」口径不一致时，**一律以官方类型为准**，本文不合并；平台另有翻唱单曲时也已剔除。

### 原创曲

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2020-02-23 | 物語りのワルツ |  |
| 2020-04-27 | ジオラマドラマ |  |
| 2020-07-16 | ハイドレンジア |  |
| 2020-07-30 | いろはに咲きて |  |
| 2020-09-24 | 透明な呼吸 somunia × ヰ世界情緒 | 合唱曲 |
| 2020-09-26 | とめどなき白情 |  |
| 2020-11-27 | 斯く美しき造花 |  |
| 2020-12-26 | シリウスの心臓 |  |
| 2020-12-30 | 雛鳥 with ヰ世界情緒 【不可解弐Q1Live Ver.】 | 合唱曲 |
| 2021-06-18 | 深淵 feat. 花譜 | 合唱曲 |
| 2021-07-12 | ヰ世界の宝石譚 |  |
| 2021-10-13 | ディメンション |  |
| 2021-10-20 | 何億光年の孤独 |  |
| 2021-10-20 | この夢に弔いを |  |
| 2021-10-20 | 春猿火 × ヰ世界情緒 愛厭奇縁 | 合唱曲 |
| 2021-10-23 | 誰もいない絵で |  |
| 2021-10-23 | ヰ世界情緒 × 花譜 暗闇 | 合唱曲 |
| 2021-10-23 | 理芽 × ヰ世界情緒 泡沫 | 合唱曲 |
| 2021-10-23 | 春猿火 × ヰ世界情緒 牢獄 | 合唱曲 |
| 2021-10-23 | ヰ世界情緒 × 幸祜 刻印 | 合唱曲 |
| 2021-12-08 | 生きていく光は |  |
| 2021-12-08 | 花譜 × ヰ世界情緒 あわく心模様 | 合唱曲 |
| 2021-12-09 | 霞がついてくる |  |
| 2022-05-21 | ARCADIA |  |
| 2022-08-17 | パンドラコール |  |
| 2022-11-09 | かたちなきもの |  |
| 2022-12-07 | 暮れなずむ約束 |  |
| 2023-03-31 | そして白に還る |  |
| 2023-05-07 | ほしをみるひと |  |
| 2023-05-17 | 春猿火 × ヰ世界情緒 生存 | 合唱曲 |
| 2023-07-26 | 理芽 × ヰ世界情緒 不的 | 合唱曲 |
| 2023-12-13 | 春猿火 × ヰ世界情緒 CALL | 合唱曲 |
| 2024-03-27 | 描き続けた君へ |  |
| 2024-06-18 | ANGELIC |  |
| 2024-07-31 | システムズコア/Systems Core |  |
| 2024-08-14 | LOLUET 双生コンフリクト feat. ヰ世界情緒 | 合唱曲 |
| 2024-10-23 | アンビバレント |  |
| 2024-12-19 | 果てなきソラへ |  |
| 2025-03-25 | みらいのかたち |  |
| 2025-06-25 | ETERNAL |  |
| 2025-07-23 | BREATHE |  |
| 2025-09-03 | ヰ世界情緒 × 春猿火 BREATHE(Rearranged ver.) | 合唱曲 |
| 2025-10-30 | キレイナヒカリ |  |
| 2025-12-14 | 春猿火 × ヰ世界情緒 LOVEぃ | 合唱曲 |
| 2026-01-04 | ラケナリアの夢 |  |
| 2026-01-11 | まぼろしの行方 |  |
| 2026-03-19 | モシモノセカイ |  |
| 2026-04-22 | FARAWAY |  |
| 2026-05-01 | 永久に枯れぬ花 |  |
| 2026-07-22 | 深海のフレイム |  |

## 3.5 幸祜（ここ／KOKO）

2020-11 开始投稿，原创曲多由 **たかやん**、MILKEY 等提供；2021 年起有连续的 Cover Live 专辑，平台另记有 EP《破茧之华》（2025-12-06）。

### 专辑／EP（官方 DISCOGRAPHY）

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2021-07-14 | [ARARE LIVE](https://kamitsubaki.jp/discography/koko/704/) | Cover Live Album |
| 2022-02-23 | [prayer type-B](https://kamitsubaki.jp/discography/koko/1370/) | 1st Album |
| 2022-02-23 | [prayer type-W](https://kamitsubaki.jp/discography/koko/1368/) | 1st Album |
| 2025-04-23 | [prayer2](https://kamitsubaki.jp/discography/koko/7253/) | 2nd Album |

### 平台补录（官方**专辑**列表之外的专辑/EP，含翻唱与 Remix，【平台】）

| 平台日期 | 标题 | 曲数 | 平台类型 |
|---|---|---|---|
| 2025-12-06 | 破茧之华 | 5 | EP |
| 2024-11-12 | ClimBinge the Remix | 13 | 专辑 |
| 2023-03-24 | ARARE LIVE 2 | 21 | 专辑 |
| 2022-02-22 | prayer | 13 | 专辑 |

> **口径提醒**：官方类型（Single／EP／Album）与萌百「迷你专辑/EP」口径不一致时，**一律以官方类型为准**，本文不合并；平台另有翻唱单曲时也已剔除。

### 原创曲

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2020-11-16 | harmony |  |
| 2021-01-01 | 白昼夢 |  |
| 2021-03-14 | この世界に口づけを |  |
| 2021-06-10 | ASH |  |
| 2021-09-18 | 瞑目 |  |
| 2021-09-25 | 夜光を呼ぶ |  |
| 2021-10-02 | the last bullet |  |
| 2021-10-20 | Mayday |  |
| 2021-10-20 | 強欲 |  |
| 2021-10-20 | Dear |  |
| 2021-12-25 | LIT |  |
| 2022-02-26 | 閃光の彼方 |  |
| 2022-07-18 | 錘 |  |
| 2022-09-14 | TIME |  |
| 2023-01-24 | ミラージュコード |  |
| 2023-03-28 | Abstractions void |  |
| 2023-09-17 | bliss |  |
| 2023-10-25 | ゲンフウケイ |  |
| 2024-06-12 | 始まりの銃声 |  |
| 2025-02-12 | むすんでひらいて |  |
| 2025-05-15 | オレンジ |  |
| 2025-05-28 | ANTINOMY |  |
| 2025-06-18 | 在処 |  |
| 2025-07-16 | Kazura |  |
| 2025-08-13 | シャングリラ |  |
| 2025-10-07 | 僕は願うことをやめたんだ |  |

### 3.6 明透（あす／ASU）

**深脊界（SINSEKAI）出身**的虚拟歌手，2021-08-23 出道，人设由**米山舞**绘制；现仍在 KAMITSUBAKI STUDIO 名册内。世界观内化身＝**地邑 阿栖（チムラ アス）**，ヰ世界救済教団教徒兼魔女候補。【官方／粉丝wiki】

#### 专辑／EP（平台，含曲目）

| 平台日期 | 标题 | 类型 | 曲数 | 曲目（平台） |
|---|---|---|---|---|
| 2026-03-03 | Holy Night LIVE | 专辑 | 10 | ブルーナイトダーリン／0g／ビターエチュード／HOME (明透×琶舞)／Symbiotic Dominion／捕食者／戯れ／アンメルト・アンブレラ (明透×琶舞×水槽)／…等 10 曲 |
| 2025-03-25 | ray of hope | 专辑 | 10 | Spiral／0g／ブルーナイトダーリン／アンメルト・アンブレラ／HEAVEN IS GONE／illumina／Shiny／Dazzling／…等 10 曲 |
| 2025-03-12 | Candle Light LIVE | 专辑 | 11 | スロウリー／Spiral／ライトイヤーズ／モノローグ／オレンジ／アンダーブーケ／アンメルト・アンブレラ／Dazzling／…等 11 曲 |
| 2024-10-31 | twilight | 专辑 | 7 | アンメルト・アンブレラ／Spiral／ブルーナイトダーリン／illumina／Dazzling／スロウリー - Acoustic Arrange -／ソラゴト - Acoustic Arrange - |
| 2024-10-31 | サンライトLIVE 3 | 专辑 | 21 | 新宝島 - サンライトLIVE 3 (Cover)／夜撫でるメノウ - サンライトLIVE 3 (Cover)／Season  - サンライトLIVE 3 (Cover)／色香水 - サンライトLIVE 3 (Cover)／戸惑いテレパシー - サンライトLIVE 3 (Cover)／凡人様 - サンライトLIVE 3 (Cover)／怪獣 - サンライトLIVE 3 (Cover)／ミックスナッツ - サンライトLIVE 3 (Cover)／…等 21 曲 |
| 2023-10-24 | サンライトLIVE 2 | 专辑 | 20 | Overdose - サンライトLIVE 2 (Cover)／STAY TUNE - サンライトLIVE 2 (Cover)／ここで息をして - サンライトLIVE 2 (Cover)／死神 - サンライトLIVE 2 (Cover)／DERO - サンライトLIVE 2 (Cover)／威風堂々 - サンライトLIVE 2 (Cover)／Pleiades - サンライトLIVE 2 (Cover)／マーシャル・マキシマイザー - サンライトLIVE 2 (Cover)／…等 20 曲 |
| 2023-10-24 | サンライトLIVE | 专辑 | 17 | 真夜中のメリーゴーランド - サンライトLIVE (Cover)／flos - サンライトLIVE (Cover)／カタオモイ - サンライトLIVE (Cover)／白日 - サンライトLIVE (Cover)／CH4NGE - サンライトLIVE (Cover)／MAGIC - サンライトLIVE (Cover)／Boi - サンライトLIVE (Cover)／Surges - サンライトLIVE (Cover)／…等 17 曲 |
| 2023-04-18 | ASU | 专辑 | 12 | 太陽（Instrumental）／スロウリー／インパーフェクト／オレンジ／ライトイヤーズ／アンダーブーケ／モノローグ／ピアス／…等 12 曲 |

#### 官方 DISCOGRAPHY 条目

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2021-11-18 | [スロウリー](https://kamitsubaki.jp/discography/asu/2263/) | （无类型标注） |
| 2022-02-15 | [ソラゴト](https://kamitsubaki.jp/discography/asu/2266/) | （无类型标注） |
| 2022-06-08 | [インパーフェクト](https://kamitsubaki.jp/discography/asu/2269/) | （无类型标注） |
| 2022-08-31 | [アンダーブーケ](https://kamitsubaki.jp/discography/asu/2271/) | （无类型标注） |
| 2022-10-21 | [サンライトLIVE](https://kamitsubaki.jp/discography/asu/2273/) | （无类型标注） |
| 2023-01-18 | [ライトイヤーズ](https://kamitsubaki.jp/discography/asu/2276/) | （无类型标注） |
| 2023-04-19 | [明透 – 1st Album「ASU」](https://kamitsubaki.jp/discography/asu/2278/) | （无类型标注） |
| 2023-08-30 | [アンメルト・アンブレラ](https://kamitsubaki.jp/discography/asu/5320/) | （无类型标注） |
| 2023-10-25 | [Cover live Album「サンライトLIVE 2」](https://kamitsubaki.jp/discography/asu/5323/) | （无类型标注） |
| 2024-04-24 | [Spiral](https://kamitsubaki.jp/discography/asu/5330/) | （无类型标注） |
| 2024-06-26 | [ブルーナイトダーリン](https://kamitsubaki.jp/discography/asu/5331/) | （无类型标注） |
| 2024-08-28 | [Dazzling](https://kamitsubaki.jp/discography/asu/5332/) | （无类型标注） |
| 2024-09-18 | [Shiny](https://kamitsubaki.jp/discography/asu/5333/) | （无类型标注） |
| 2024-10-30 | [HEAVEN IS GONE](https://kamitsubaki.jp/discography/asu/5334/) | （无类型标注） |
| 2024-11-27 | [アイノ最適解](https://kamitsubaki.jp/discography/rim/5269/) | Single |
| 2024-12-04 | [Winter Sparkler](https://kamitsubaki.jp/discography/asu/5400/) | （无类型标注） |
| 2024-12-29 | [Aster](https://kamitsubaki.jp/discography/asu/5629/) | （无类型标注） |
| 2025-03-26 | [2nd Album「ray of hope」](https://kamitsubaki.jp/discography/asu/6550/) | （无类型标注） |
| 2025-05-07 | [Link](https://kamitsubaki.jp/discography/asu/7138/) | （无类型标注） |
| 2025-09-30 | [HOME](https://kamitsubaki.jp/discography/asu/8993/) | （无类型标注） |
| 2025-11-05 | [ビターエチュード](https://kamitsubaki.jp/discography/asu/8996/) | （无类型标注） |
| 2025-12-24 | [ルートキュア](https://kamitsubaki.jp/discography/asu/9128/) | （无类型标注） |
| 2026-05-06 | [Little Bit](https://kamitsubaki.jp/discography/asu/10718/) | （无类型标注） |
| 2026-07-08 | [レディース・ロール・メソッド](https://kamitsubaki.jp/discography/asu/12152/) | （无类型标注） |
| 2026-10-14 | [メドレーの観察](https://kamitsubaki.jp/discography/asu/12155/) | （无类型标注） |

#### 原创曲（萌百逐曲表）

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2021-11-18 | スロウリー / Slowly |  |
| 2022-02-15 | ソラゴト / 虚言 |  |
| 2022-06-08 | インパーフェクト / Imperfect |  |
| 2022-07-02 | 赤い洗礼 明透 × 存流 | 合唱曲 |
| 2022-07-02 | 新世界へ 明透 × 存流 | 合唱曲 |
| 2022-08-31 | アンダーブーケ / Under Bouquet |  |
| 2023-01-18 | ライトイヤーズ / LIGHT YEARS |  |
| 2023-04-19 | オレンジ / Orange |  |
| 2023-04-19 | モノローグ / 独白 |  |
| 2023-04-19 | ピアス / 耳环 |  |
| 2023-04-19 | エンゼルフィッシュ / 天使鱼 |  |
| 2023-04-19 | リンカーネイション / Reincarnation |  |
| 2023-08-30 | アンメルト・アンブレラ / Unmelt Unbrella |  |
| 2024-04-24 | Spiral |  |
| 2024-06-26 | ブルーナイトダーリン / blue night darling |  |
| 2024-08-28 | Dazzling |  |
| 2024-09-18 | Shiny |  |
| 2024-10-30 | HEAVEN IS GONE |  |
| 2024-12-04 | Winter Sparkler |  |
| 2024-12-28 | Aster |  |
| 2025-05-07 | Link |  |
| 2025-09-03 | HOME |  |
| 2025-11-05 | ビターエチュード / Bitter Etude |  |
| 2025-12-24 | ルートキュア / ROOT CURE |  |

> ★ **同名专辑提醒（ASU）**：明透 1st Album 名为 **《ASU》**，存流 1st Album 名为 **《ARU》**，两者**同日（2023-04-18）、同曲数（12）**，但**是两张不同的专辑**（曲目完全不同）。检索时必须带艺人名：「明透 ASU」「存流 ARU」，不要只写 ASU／ARU。

### 3.7 存流（ある／ARU）

2021-06-20 出道，人设同为**米山舞**绘制，设定上是**明透的姐姐**；2024-04-09 Albemuth 1st ONE-MAN LIVE 后**毕业**（引退）。世界观内化身＝**天祢 亜留（アマネ アル）**，ヰ世界救済教団教徒兼魔女候補。【粉丝wiki】

#### 专辑／EP（平台，含曲目）

| 平台日期 | 标题 | 类型 | 曲数 | 曲目（平台） |
|---|---|---|---|---|
| 2023-10-24 | むーんらいとLIVE | 专辑 | 14 | 少年よ我に帰れ - むーんらいとLIVE (Cover)／グッバイ宣言 - むーんらいとLIVE (Cover)／いっせーのーで - むーんらいとLIVE (Cover)／ひみつのユーフォー - むーんらいとLIVE (Cover)／神っぽいな - むーんらいとLIVE (Cover)／猫の食卓 - むーんらいとLIVE (Cover)／未確認少女進行形 - むーんらいとLIVE (Cover)／フォニイ - むーんらいとLIVE (Cover)／…等 14 曲 |
| 2023-04-18 | ARU | 专辑 | 12 | 月（Instrumental）／さよなら／あおいゆめ／あふれる／いんさいどぐるうゔ／まってるよ／れぞんでーとる／しれね／…等 12 曲 |

#### 官方 DISCOGRAPHY 条目

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2021-08-14 | [さよなら](https://kamitsubaki.jp/discography/aru/2243/) | （无类型标注） |
| 2022-02-15 | [いんさいどぐるうゔ](https://kamitsubaki.jp/discography/aru/2246/) | （无类型标注） |
| 2022-04-02 | [まってるよ](https://kamitsubaki.jp/discography/aru/2249/) | （无类型标注） |
| 2022-07-06 | [あふれる](https://kamitsubaki.jp/discography/aru/2260/) | （无类型标注） |
| 2022-09-06 | [むーんらいとLIVE](https://kamitsubaki.jp/discography/aru/2252/) | （无类型标注） |
| 2022-12-28 | [あおいゆめ](https://kamitsubaki.jp/discography/aru/2254/) | （无类型标注） |
| 2023-04-19 | [存流 – 1st Album「ARU」](https://kamitsubaki.jp/discography/aru/2257/) | （无类型标注） |

#### 原创曲（萌百逐曲表）

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2021-08-14 | さよなら /再见 |  |
| 2022-02-15 | いんさいどぐるうゔ /Inside Groove |  |
| 2022-04-02 | まってるよ /等着你哦 |  |
| 2022-07-02 | 赤い洗礼 | 合唱曲 |
| 2022-07-02 | 新世界へ | 合唱曲 |
| 2022-07-06 | あふれる /满溢而出 |  |
| 2022-12-28 | あおいゆめ /湛蓝之梦 |  |
| 2023-03-18 | いのり /祈愿 |  |
| 2023-04-19 | つきかげ /月影 |  |
| 2023-06-21 | しるし /印记 |  |

> ★ **同名专辑提醒（ARU）**：存流 1st Album = **《ARU》**（2023-04-18，12 曲），与明透 **《ASU》**（同日、同曲数）**不是同一张**。

#### 3.7.1 《ASU》与《ARU》对照（★ 易混）

| 项目 | **ASU** | **ARU** |
|---|---|---|
| 担当 | **明透** | **存流** |
| 发行日 | 2023-04-18 | 2023-04-18 |
| 曲数 | 12 | 12 |
| 平台定位 | 专辑 | 专辑 |
| 首曲 | 太陽（Instrumental） | 月（Instrumental） |
| 是否同一张 | ❌ 不是 | ❌ 不是 |

> 两作**同日发行、曲数相同**，专辑名与艺人名还同音不同字（ASU／ARU），是写代码或写考据时最容易串台的一对。**合并引用时必须写明艺人**。

### 3.8 琶舞（べま／BEMA）

2025-04-30 出道，原计划与存流、明透共同构成「真正的 Albemuth」，因存流毕业而未能实现；现与明透组成以「爱」为主题的新组合（名称官方未定）。【粉丝wiki／存疑】

#### 专辑／EP（平台，含曲目）

| 平台日期 | 标题 | 类型 | 曲数 | 曲目（平台） |
|---|---|---|---|---|
| 2026-03-03 | Holy Night LIVE | 专辑 | 10 | ブルーナイトダーリン／0g／ビターエチュード／HOME (明透×琶舞)／Symbiotic Dominion／捕食者／戯れ／アンメルト・アンブレラ (明透×琶舞×水槽)／…等 10 曲 |
| 2025-04-30 | THE COVER | EP | 5 | THE COVER 1 Loveit - biz×ZERA feat LOLUET covered by 琶舞.flac／THE COVER 2 MIRROR - Ado covered by 琶舞.flac／THE COVER 3 対象a - anNina covered by 琶舞.flac／THE COVER 4 お呪い - なきそ covered by 琶舞.flac／THE COVER 5 夢をみせて - Cö shu Nie covered by 琶舞.flac |

#### 官方 DISCOGRAPHY 条目

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2025-05-07 | [Symbiotic Dominion](https://kamitsubaki.jp/discography/bema/7143/) | （无类型标注） |
| 2025-09-30 | [戯れ](https://kamitsubaki.jp/discography/bema/8995/) | （无类型标注） |
| 2025-11-05 | [捕食者](https://kamitsubaki.jp/discography/bema/9000/) | （无类型标注） |
| 2025-12-24 | [ファーストエイド](https://kamitsubaki.jp/discography/bema/9131/) | （无类型标注） |
| 2025-12-25 | [Cover live Album「Dark Night LIVE」](https://kamitsubaki.jp/discography/bema/9001/) | （无类型标注） |
| 2026-05-06 | [月夜にマリアージュ](https://kamitsubaki.jp/discography/bema/10721/) | （无类型标注） |
| 2026-07-08 | [Alt Skin](https://kamitsubaki.jp/discography/bema/12157/) | （无类型标注） |

#### 原创曲（萌百逐曲表）

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2025-05-07 | Symbiotic Dominion |  |
| 2025-09-03 | 戯れ / tawamure |  |
| 2025-11-05 | 捕食者 / Predator |  |
| 2025-12-24 | ファーストエイド / FIRST AID |  |

> **口径提醒**：琶舞的平台 discography 里大部分是**翻唱单曲**（曲名含 covered by 琶舞），本文的原创曲只取萌百「原创曲」表；EP《THE COVER》整张为翻唱，**不计入原创曲**。《Holy Night LIVE》与明透共有（含合唱曲「HOME」）。

### 3.9 CIEL（しえる）

KAMITSUBAKI STUDIO 选拔企划「**神椿市異住定獣課**」中发掘的虚拟歌手；世界观内化身＝**彩季 詩得（サイキ シエル）**，肆番街相遇、**復興課课员**。【官方】

#### 专辑／EP（平台，含曲目）

| 平台日期 | 标题 | 类型 | 曲数 | 曲目（平台） |
|---|---|---|---|---|
| 2026-03-03 | 再晴 | EP | 4 | 常しなえ／空白の暈／此処で咲かせて (CIEL Solo ver.)／ろうそく |
| 2024-07-23 | 空想劇 | 专辑 | 13 | introduction／窓を開けて／君の望み、君の願い／眼裏の懐疑／馥郁の街／少年漫画／空より／生活に落ちる／…等 13 曲 |
| 2023-12-21 | MYSTICAL III | 专辑 | 9 | Let the Mystical Power flow in_9／See the Flowers of Life blooming_9／Let the Mystical Power flow in_10／See the Flowers of Life blooming_10／Let the Mystical Power flow in_11／See the Flowers of Life blooming_11／Let the Mystical Power flow in_12／See the Flowers of Life blooming_12／…等 9 曲 |
| 2023-12-12 | 空想少女 | EP | 4 | うわのそら／空中散歩／僕たちの群青／空想少女 |
| 2023-10-03 | STRAWBERRY LIVE 2 | 专辑 | 29 | Vinyl(Live)／MC1(Live)／ド屑(Live)／従属ふりったー(Live)／シカバネーゼ(Live)／コールボーイ(Live)／MC2(Live)／ロミオとシンデレラ(Live)／…等 29 曲 |
| 2023-02-14 | STRAWBERRY LIVE | 专辑 | 29 | リビングデッド・ユース（Live）／イミテーション（Live）／MC1（Live）／DARKHERO（Live）／CH4NGE（Live）／傷心中（Live）／MC2（Live）／きっと想（Live）／…等 29 曲 |
| 2022-11-27 | Singularity Live | 专辑 | 25 | 君の望み、君の願い (Live at Virtual, 2022)／少年漫画 (Live at Virtual, 2022)／霞がついてくる (Live at Virtual, 2022)／ディメンション (Live at Virtual, 2022)／マボロシのまち (Live at Virtual, 2022)／生きていく光は (Live at Virtual, 2022)／異星にいこうね (feat. 星界) [Live at Virtual, 2022]／パンドラコール (Live at Virtual, 2022)／…等 25 曲 |

#### 官方 DISCOGRAPHY 条目

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2021-06-04 | [窓を開けて](https://kamitsubaki.jp/discography/ciel/389/) | Single |
| 2021-09-15 | [眼裏の懐疑](https://kamitsubaki.jp/discography/ciel/779/) | Single |
| 2022-11-23 | [理芽×ヰ世界情緒 TWO-MAN LIVE「Singularity Live」](https://kamitsubaki.jp/discography/rim/1729/) | Blu-ray |

#### 原创曲（萌百逐曲表）

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2021-06-04 | 窓を開けて |  |
| 2021-07-30 | 窓を開けて(Acoustic ver.) |  |
| 2021-09-15 | 眼裏の懐疑 |  |
| 2021-10-20 | 君の望み、君の願い |  |
| 2021-12-21 | 君と見た色彩 |  |
| 2022-03-20 | 馥郁の街 |  |
| 2022-07-24 | 君の望み、君の願い at Singularity Live |  |
| 2022-08-18 | 少年漫画 |  |
| 2022-11-10 | 眼裏の懐疑 at Singularity Live2 |  |

> **口径提醒**：CIEL 的专辑多为 **Cover Live 专辑**（STRAWBERRY LIVE 系列、Singularity Live），原创专辑是《空想劇》《MYSTICAL III》与 EP《空想少女》《再晴》。

## 4. 其他组合

### 4.1 空爽（KUUSOU）— CIEL × Sooda

- 官方：「CIELとSoodaによるバーチャル音楽ユニット」，主题「清楚・柔らかさ」，制服母题。【官方】
- **平台发行**（官方 DISCOGRAPHY 未列）：2026-01-14 出道曲「透明流星ラプソディ」／2026-06-17 1st EP「**CYAN**」（5 曲）／2026-08-25「知らない」等。【平台】
- ⚠️ 无逐曲表，只登记发行事实；平台另有 3 首翻唱单曲（标注 Covered by 空爽）。

### 4.2 心世紀（SINSEIKI）

- 官方定位：**Xtuber** 3 人组（御莉姫 ORIHIME／佳鏡院 KAKYOIN／硝子宮 GARASUMIYA），母体**少女革命計画**。【官方】
- **1st Album「改変-心-」（2025-10-29，11 曲）**：フェイクナイト・シンデレラ／Ephemeral／ロストオービット／パーフェクション／ココロト／いずれ僕は溶けて／コントラスト／うそ鳴き／FantastiQ／ミリオン・コンプレクシティ／改変 -心-。【官方】
- 官方发行列表：

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2024-08-09 | [フェイクナイト・シンデレラ](https://kamitsubaki.jp/discography/sinseiki/3693/) | 1st Single |
| 2024-10-09 | [well](https://kamitsubaki.jp/discography/sinseiki/4677/) | 1st Single |
| 2024-10-18 | [パーフェクション](https://kamitsubaki.jp/discography/sinseiki/4466/) | 2nd Single |
| 2024-10-23 | [夢の揺籠](https://kamitsubaki.jp/discography/sinseiki/4876/) | 1st Single |
| 2024-11-06 | [シンユウ](https://kamitsubaki.jp/discography/sinseiki/5139/) | 1st Single |
| 2024-11-20 | [現世回帰](https://kamitsubaki.jp/discography/sinseiki/5588/) | 1st Single |
| 2024-11-27 | [アイ](https://kamitsubaki.jp/discography/sinseiki/5589/) | 2nd Single |
| 2024-12-11 | [宇宙逃避行](https://kamitsubaki.jp/discography/sinseiki/5593/) | 2nd Single |
| 2024-12-25 | [Talking Doll](https://kamitsubaki.jp/discography/sinseiki/5597/) | 2nd Single |
| 2025-01-22 | [Ephemeral](https://kamitsubaki.jp/discography/sinseiki/5784/) | 3rd Single |
| 2025-02-05 | [ガラスのパズル](https://kamitsubaki.jp/discography/sinseiki/6080/) | Collaboration Song |
| 2025-02-12 | [シネマティック](https://kamitsubaki.jp/discography/sinseiki/6082/) | Collaboration Song |
| 2025-02-19 | [瞬き](https://kamitsubaki.jp/discography/sinseiki/6084/) | Collaboration Song |
| 2025-02-26 | [ココロト](https://kamitsubaki.jp/discography/sinseiki/6248/) | 4th Single |
| 2025-03-12 | [ANGER](https://kamitsubaki.jp/discography/sinseiki/6769/) | 3rd Single |
| 2025-03-19 | [キリガサガリキ](https://kamitsubaki.jp/discography/sinseiki/6771/) | 3rd Single |
| 2025-03-26 | [unknown](https://kamitsubaki.jp/discography/sinseiki/6773/) | 3rd Single |
| 2025-04-02 | [うそ鳴き](https://kamitsubaki.jp/discography/sinseiki/6775/) | 5th Single |
| 2025-05-21 | [ミリオン・コンプレクシティ](https://kamitsubaki.jp/discography/sinseiki/7400/) | 6th single |
| 2025-07-02 | [鈍色幻灯](https://kamitsubaki.jp/discography/sinseiki/7760/) | 2nd Single |
| 2025-07-16 | [改変](https://kamitsubaki.jp/discography/sinseiki/9062/) | （无类型标注） |
| 2025-08-27 | [主人行路](https://kamitsubaki.jp/discography/sinseiki/8334/) | 3rd Single |
| 2025-10-29 | [改変-心-](https://kamitsubaki.jp/discography/sinseiki/9068/) | 1st Album |
| 2025-11-12 | [月へゆく](https://kamitsubaki.jp/discography/sinseiki/9200/) | 4th Single |
| 2025-11-26 | [Masquerade Kill](https://kamitsubaki.jp/discography/sinseiki/9203/) | 4th Single |
| 2025-12-24 | [クロマティック feat.ヰ世界情緒](https://kamitsubaki.jp/discography/sinseiki/9674/) | single |
| 2026-01-20 | [雑几帖](https://kamitsubaki.jp/discography/sinseiki/10297/) | 7th single |
| 2026-03-06 | [さよなら、楽園](https://kamitsubaki.jp/discography/sinseiki/10748/) | 4th Single |
| 2026-04-08 | [桜心中](https://kamitsubaki.jp/discography/sinseiki/10752/) | 5th Single |

#### 4.2.1 少革官方 DISCOGRAPHY 全表（49 条，含成员个人名义）

> 来源：[girlsrevolutionproject.jp/discography](https://girlsrevolutionproject.jp/discography/)【官方】。少革把**成员个人名义**的单曲也挂在本站（例：御莉姫《桜心中》、硝子宮《さよなら、楽園》），所以这里按「官方署名」原样列出，**不强行归并成组合**。

| 发行日 | 标题 | 官方署名 |
|---|---|---|
| 2026-04-08 | 桜心中 | 御莉姫 |
| 2026-03-06 | さよなら、楽園 | 硝子宮 |
| 2026-02-20 | 雑几帖 | 心世紀 |
| 2026-02-18 | 侵蝕の記録 | 美古途 |
| 2026-01-23 | 大罪 | 罪十罰 |
| 2026-01-07 | sweet/sour | 氷夏至 |
| 2025-12-24 | クロマティック feat.ヰ世界情緒 | 心世紀×罪十罰 |
| 2025-12-17 | 化け物でいさせて | 夕凪機 |
| 2025-11-26 | Masquerade Kill | 御莉姫 |
| 2025-11-12 | 月へゆく | 佳鏡院 |
| 2025-10-29 | 改変-心- | 心世紀 |
| 2025-10-29 | 改変-罪- | 罪十罰 |
| 2025-08-27 | 主人行路 | 心世紀×罪十罰 |
| 2025-07-16 | 改変 | 心世紀×罪十罰 |
| 2025-07-02 | 鈍色幻灯 | 心世紀×罪十罰 |
| 2025-06-04 | SURVIVAL | 罪十罰 |
| 2025-05-21 | ミリオン・コンプレクシティ | 心世紀 |
| 2025-05-07 | SHOCK | 罪十罰 |
| 2025-04-30 | Yellow Yellow | 夕凪機 |
| 2025-04-23 | 回想の層 | 美古途 |
| 2025-04-16 | ホンキートンキーラブ | 氷夏至 |
| 2025-04-02 | うそ鳴き | 心世紀 |
| 2025-03-26 | unknown | 硝子宮 |
| 2025-03-19 | キリガサガリキ | 佳鏡院 |
| 2025-03-12 | ANGER | 御莉姫 |
| 2025-03-05 | blindness | 罪十罰 |
| 2025-02-26 | ココロト | 心世紀 |
| 2025-02-19 | 瞬き | 御莉姫,夕凪機 |
| 2025-02-12 | シネマティック | 佳鏡院,氷夏至 |
| 2025-02-05 | ガラスのパズル | 硝子宮,美古途 |
| 2025-01-29 | Synapse | 罪十罰 |
| 2025-01-22 | Ephemeral | 心世紀 |
| 2025-01-08 | アワセカガミ | 美古途 |
| 2024-12-25 | Talking Doll | 御莉姫 |
| 2024-12-18 | プレイヤーわたし | 夕凪機 |
| 2024-12-11 | 宇宙逃避行 | 佳鏡院 |
| 2024-12-04 | ジャンク | 氷夏至 |
| 2024-11-27 | アイ | 硝子宮 |
| 2024-11-20 | 現世回帰 | 心世紀×罪十罰 |
| 2024-11-13 | セルフィッシュ | 美古途 |
| 2024-11-06 | シンユウ | 御莉姫 |
| 2024-10-30 | アバウト | 夕凪機 |
| 2024-10-23 | 夢の揺籠 | 佳鏡院 |
| 2024-10-16 | アライブ | 氷夏至 |
| 2024-10-09 | well | 硝子宮 |
| 2024-09-25 | DIGGER | 罪十罰 |
| 2024-09-18 | パーフェクション | 心世紀 |
| 2024-08-14 | 弔花 | 罪十罰 |
| 2024-08-09 | フェイクナイト・シンデレラ | 心世紀 |

### 4.3 罪十罰（TSUMITOBATSU）

- 官方定位：**バーチャルシンガー** 3 人组（氷夏至 HINAGESHI／美古途 MIKOTO／夕凪機 YUNAGI），母体同少革。【官方】
- **1st Album「改変-罪-」（2025-10-29，11 曲）**；与心世紀合作单曲《改変》《主人行路》《鈍色幻灯》《クロマティック feat.ヰ世界情緒》。【官方】
- 官方发行列表：

| 发行日 | 标题 | 官方类型 |
|---|---|---|
| 2024-08-14 | [弔花](https://kamitsubaki.jp/discography/tsumitobatsu/4207/) | 1st Single |
| 2024-09-25 | [DIGGER](https://kamitsubaki.jp/discography/tsumitobatsu/4636/) | 2nd Single |
| 2024-10-30 | [アバウト](https://kamitsubaki.jp/discography/tsumitobatsu/4939/) | 1st Single |
| 2024-11-13 | [セルフィッシュ](https://kamitsubaki.jp/discography/tsumitobatsu/5140/) | 1st Single |
| 2024-11-20 | [現世回帰](https://kamitsubaki.jp/discography/sinseiki/5588/) | 1st Single |
| 2024-12-04 | [ジャンク](https://kamitsubaki.jp/discography/tsumitobatsu/5591/) | 2nd Single |
| 2024-12-18 | [プレイヤーわたし](https://kamitsubaki.jp/discography/tsumitobatsu/5595/) | 2nd Single |
| 2025-01-08 | [アワセカガミ](https://kamitsubaki.jp/discography/tsumitobatsu/5782/) | 2nd Single |
| 2025-01-29 | [Synapse](https://kamitsubaki.jp/discography/tsumitobatsu/6078/) | 3rd Single |
| 2025-02-05 | [ガラスのパズル](https://kamitsubaki.jp/discography/sinseiki/6080/) | Collaboration Song |
| 2025-02-12 | [シネマティック](https://kamitsubaki.jp/discography/sinseiki/6082/) | Collaboration Song |
| 2025-02-19 | [瞬き](https://kamitsubaki.jp/discography/sinseiki/6084/) | Collaboration Song |
| 2025-03-05 | [blindness](https://kamitsubaki.jp/discography/tsumitobatsu/6250/) | 4th Single |
| 2025-04-16 | [ホンキートンキーラブ](https://kamitsubaki.jp/discography/tsumitobatsu/7194/) | 3rd single |
| 2025-04-23 | [回想の層](https://kamitsubaki.jp/discography/tsumitobatsu/7211/) | 3rd single |
| 2025-04-30 | [Yellow Yellow](https://kamitsubaki.jp/discography/tsumitobatsu/7214/) | 3rd single |
| 2025-05-07 | [SHOCK](https://kamitsubaki.jp/discography/tsumitobatsu/7216/) | 5th single |
| 2025-06-04 | [SURVIVAL](https://kamitsubaki.jp/discography/tsumitobatsu/7515/) | 6th single |
| 2025-07-02 | [鈍色幻灯](https://kamitsubaki.jp/discography/sinseiki/7760/) | 2nd Single |
| 2025-07-16 | [改変](https://kamitsubaki.jp/discography/sinseiki/9062/) | （无类型标注） |
| 2025-08-27 | [主人行路](https://kamitsubaki.jp/discography/sinseiki/8334/) | 3rd Single |
| 2025-10-17 | [アライブ](https://kamitsubaki.jp/discography/tsumitobatsu/4767/) | 1st Single |
| 2025-10-29 | [改変-罪-](https://kamitsubaki.jp/discography/tsumitobatsu/9069/) | 1st Album |
| 2025-12-17 | [化け物でいさせて](https://kamitsubaki.jp/discography/tsumitobatsu/9356/) | 4th Single |
| 2025-12-24 | [クロマティック feat.ヰ世界情緒](https://kamitsubaki.jp/discography/sinseiki/9674/) | single |
| 2026-01-07 | [sweet/sour](https://kamitsubaki.jp/discography/tsumitobatsu/9819/) | 4th Single |
| 2026-01-23 | [大罪](https://kamitsubaki.jp/discography/tsumitobatsu/10162/) | 7th single |
| 2026-02-18 | [侵蝕の記録](https://kamitsubaki.jp/discography/tsumitobatsu/10294/) | 4th single |

### 4.4 VALIS（ヴァリス）

- 官方定位：「リアルとバーチャルを行き来する」虚拟少女组合，现 **5 人**（NINA 于 2024-03-08 毕业）；**2025-12 final live 后「無期限活動休止」**（官方措辞，不是「解散」）。【官方】
- **专辑（平台数据，官方 DISCOGRAPHY 未列）**【平台】：

| 平台日期 | 标题 | 曲数 | 平台类型 |
|---|---|---|---|
| 2025-08-26 | 悠久オーケストラ | 15 | 专辑 |
| 2024-09-03 | 青春イマジネーション 瓦利斯飯店ver. | 14 | 专辑 |
| 2024-09-03 | 青春イマジネーション 覚醒ver. | 16 | 专辑 |
| 2024-04-03 | 再現ガールフレンド | 10 | 专辑 |
| 2023-04-17 | 流転ファンタジア（深脊界 ver.） | 10 | 专辑 |
| 2023-04-17 | 流転ファンタジア（覚醒 ver.） | 12 | 专辑 |
| 2022-04-22 | 覚醒ヒストリア(裏世界 ver.) | 11 | 专辑 |
| 2022-04-22 | 覚醒ヒストリア(覚醒 ver.) | 13 | 专辑 |

> ★ 平台显示的五套专辑与版本：**覚醒ヒストリア**（2022，覚醒 ver. 13 曲／裏世界 ver. 11 曲）、**流転ファンタジア**（2023，覚醒 ver. 12 曲／深脊界 ver. 10 曲）、**再現ガールフレンド**（2024，10 曲）、**青春イマジネーション**（2024，覚醒ver. 16 曲／瓦利斯飯店ver. 14 曲）、**悠久オーケストラ**（2025，15 曲）。
> 本仓库 `related-settings.md` §13.4 早前只记到 2nd／3rd，**本表把 1st 与 4th／5th 补齐**；但**版本名与曲数的对应仍以平台为准**，未获官方页确认。

- 曲目（萌百逐曲表，22 条）：

| 公开日 | 曲名 | 类别 |
|---|---|---|
| 2020-05-15 | 残響ヴァンデラー |  |
| 2020-06-29 | 真夜中コンツェルト |  |
| 2020-07-31 | 道化師ブランケット |  |
| 2020-09-09 | 開幕ゼノパレード |  |
| 2020-09-30 | 激情インプロビゼーション |  |
| 2020-11-13 | 超常現象ダンスダンス |  |
| 2020-11-27 | 錯綜リフレクション |  |
| 2020-12-25 | 革命バーチャルリアリティ |  |
| 2021-01-29 | 鈍色リグレット |  |
| 2021-02-26 | 再構成ウィーバー |  |
| 2021-04-16 | 相反ヴァラエティ |  |
| 2021-06-21 | 新世界ピグマリオン |  |
| 2021-07-09 | 天命系メルト |  |
| 2021-10-24 | 物換星移カタルシス |  |
| 2021-11-18 | 境界線マクガフィン |  |
| 2022-02-25 | 革命バーチャルリアリティ （覚醒 ver.）（Remix：安宅秀紀） |  |
| 2022-03-19 | 天命系メルト （覚醒 ver.） |  |
| 2022-05-01 | 一陽レガシー |  |
| 2022-07-31 | 偶像ナイトメア |  |
| 2022-08-21 | 偶像ナイトメア 【転生デパーチャーLIVE ver.】 |  |
| 2022-09-30 | 物換星移カタルシス 【転生デパーチャーLIVE ver.】 |  |
| 2022-11-26 | 再見ロマネスク |  |

> ⚠️ VALIS 属 **SINSEKAI RECORD（深脊界）** 系谱。**乐曲可用**（2026-10-18 决定，见 §4.6）；但**设定不并入**——不要把 VALIS 的角色/店铺/结界设定写进神椿市，**引曲不引设定**。

### 4.5 音楽的同位体（V.I.P）

- 官方定义：「KAMITSUBAKI STUDIOのバーチャルシンガー達の**歌声をベースとして生まれた人工歌唱ソフトウェア**を中心とする」企划。【官方】
- 派生歌手：**可不（KAFU）**、**V.I.P**（另有裏命／羽累／星界／狐子，分别对应五位魔女）。【官方／粉丝wiki】
- **平台发行**【平台】：专辑《生命線》（2026-03-20，12 曲）、EP《Melodious Melodies 4》（2026-04-25，5 曲）；更早的单曲如《夕焼けのまほう》（2023-10-28）。
- 曲例（《神椿市協奏中。》書き下ろし，2025-02-26）：「ゆりかご」（可不）、「月光」（V.I.P）；協奏中 No.6「V.I.P」：コールドケース（可不）／セレマ（裏命）／下剋嬢（羽累）／わたしいまめまいしたわ（星界）／破壊少女（狐子）。【官方】

### 4.6 少女革命計画（GIRLS REVOLUTION PROJECT）

- 官方：心世紀与罪十罰所属的**音乐×故事**企划，口号「深化せよ、電子の少女達！」；1st LIVE「改変」（2025-07-11）、2nd「Revolutio」（2026-08-08）。【官方】
- ★ **2026-10-18 决定（用户指示）**：**少革等平级企划的乐曲可以用**，不必等官方把它们并进神椿市线。
  - **乐曲层面**：可作 BGM/关卡曲/角色主题曲的素材，**按【官方】或【平台】标注出处**即可。
  - **设定层面**：仍未并入（`related-settings.md` §11 的取舍保持），**不要把少革的角色、组织、世界观写进神椿市设定**；引曲不引设定。
  - 这条覆盖 VALIS／深脊界等同类平级企划（见 §4.4 的说明）。

---

## 5. 《神椿市建設中。》相关乐曲

### 5.1 动画 OP／ED 与乐曲集「仮想都市録」

- **OP「歌姫」／ED「追憶」**：均为 **V.W.P**；单曲 2025-07-30（KTR-201）。【官方二次】
- **乐曲集「仮想都市録」**（2025-11-19；通常盤 ¥3,850／FINDME STORE 限定 SPECIAL BOX ¥16,500）：
  - **DISC1 全 13 曲**（各话 ED 群＋2 曲未公开）
  - **DISC2–3＝オリジナルサウンドトラック 50 曲**（2025-09-26 数字先行）
  - 出处：动画官网音乐页【官方二次】、本仓库 `worldview.md` §2.6

| # | 曲名 | 担当 | 用途 |
|---|---|---|---|
| 1 | 歌姫 | V.W.P | 动画 OP |
| 2 | 追憶 | V.W.P | 动画 ED |
| 3 | BREATHE | ヰ世界情緒 | 第 2 话 ED |
| 4 | 閃光だった | 理芽 | 第 3 话 ED |
| 5 | 距離。 | 春猿火 | 第 4 话 ED |
| 6 | シャングリラ | 幸祜 | 第 5 话 ED |
| 7 | ひとえに壊れて | 花譜 | 第 6 话 ED |
| 8 | 閃光だった（Rearranged） | 理芽 × 幸祜 | 第 7 话 |
| 9 | BREATHE（Rearranged） | ヰ世界情緒 × 春猿火 | 第 8 话 |
| 10 | 欲望 | V.W.P | 第 9 话 |
| 11 | 電脳 sinka ver. | V.W.P | 第 10 话 |
| 12 | （未公开） | — | DISC1 第 12 曲 |
| 13 | （未公开） | — | DISC1 第 13 曲 |

> DISC1 第 12、13 曲在官方商品页**未公开曲名**，按「未公开」登记，**不猜测**。

### 5.2 动画 OST 50 曲（作曲：朝比奈健人）

01 開幕　02 理不尽　03 混戦　04 戦闘　05 ピンチ！

06 滅びの災禍　07 不可解空間　08 張り詰めた空気　09 日常 of 日常　10 前兆と伝播

11 谷置狸眼　12 ブリーフィング　13 迫り来る危機　14 出撃　15 祈りの歌

16 サイバーな世界　17 くーげるの最期　18 衝撃の事実　19 まくすうぇる　20 突進！

21 兆候とバグ　22 はすたー　23 ノクターン　24 神椿市の夜　25 神椿市の昼

26 オカルトタイム　27 戦慄　28 終末紀行　29 弐番街にて　30 異質的重圧

31 レクイエム　32 屍　33 静止　34 追憶の奥へ　35 フラジャイル

36 バリス崩壊　37 にじむ心　38 疑心暗鬼　39 出口を見失い　40 かるら

41 不協和音　42 穏やかな朝　43 かわいいはゴキゲン！　44 なんだそれ　45 青い春

46 ソフィアの語る事実　47 まくすうぇるの孤独　48 次元境界　49 復活は見えているか　50 ラストバトル

> 出处：Apple Music／iTunes 官方发行记录（collectionId 1840790693，50 tracks，2025-09-26）与百度百科曲目表；本仓库 `research/official_anime_baike.md` §8 已逐条转录。【官方元数据】

### 5.3 游戏曲目

| 作品 | 曲目情况 | 出处 |
|---|---|---|
| **REGENERATE**（ADV） | 新曲 **5 首**、合计 **40 曲以上**；新曲含 V.W.P「真偽」。举例：花譜「魔女」「quiz」／理芽「食虫植物」「ジュブナイル」／春猿火「百花繚乱」「身空歌」／ヰ世界情緒「ヰ世界の宝石譚」「ARCADIA」／幸祜「the last bullet」「レイヴン・フリージア」／V.W.P「電脳」「魔女(真)」「牢獄」「真偽」／Albemuth「新世界へ」 | 【官方】游戏详情页 |
| **協奏中** | 节奏游戏部分收录 KAMITSUBAKI 曲库；BGM 专辑公告（2025-03-26）另行发行 | 【官方二次】 |
| **VIRTUAL REALITY** | BGM 曲例：第 1 曲「観測 -Observation Room-」；平台另记 V.W.P EP《都市 from REGENERATE》（2025-04-10，5 曲）、《都市II from VIRTUAL REALITY》（2025-12-18，5 曲） | 【官方】srd EN/CN 页／【平台】 |

> ★ 官方明言 REGENERATE 的乐曲「**物語とリンクして世界観を広げます**」——**乐曲与故事联动是官方设计**，可放心作为本作「歌＝魔法」设定的支撑。

---

## 6. 附录 A：官方厂牌列表中的其他署名艺人

> 官方 DISCOGRAPHY 是**厂牌级**列表，除五位魔女与各组合外还包含作曲家/姊妹厂牌艺人。下表仅作索引（**不属于「神椿各成员」口径**，不应写进成员名单）。

| 署名 | 官方条目数 | 近作举例 |
|---|---|---|
| 廉 | 24 | 夢を諦める日／余命日記／嘘月が綺麗ですね |
| 香椎モイミ | 18 | 管理欲／ブルーヒーロー／あくむのひかり |
| 平田義久 | 8 | 夜に暇電／日本の夜／渇愛論II |
| DUSTCELL | 21 | 可笑しな生き物／DUSTCELL LIVE 2023 -DAWN-／DUSTCELL TOUR 2023「ROUND TRIP」 |
| 大沼パセリ | 12 | ボニー&クライド／MIRROR／DELETE |
| Guiano | 15 | faker／imagine／空っぽなら、踊ろうぜ |
| 梓川 | 9 | Shifter／friction（Remix）feat. 梓川／Cover Live Album「LIVE ECLIPSE -prelude to β-」 |
| 詩道 | 10 | レイン／水の泡／冷たい暈 |
| 跳亜 | 7 | Xday／凍結／天地晴雨 |
| 廻花 | 5 | うまれるまえからきみをしってる／スタンドバイミー／ひぐらしのうた |
| Empty old City | 5 | Daisy Crown／Death Designer／Astronomy |
| ANMC | 6 | また旅はネコミミと feat.kahoca(from EoC), 一ノ瀬陽鞠／二人だけの物語 feat.むﾄ, m／moonless feat.椎可 |
| Awairo | 4 | 烙印／Satellite／個性 |
| Misumi | 4 | 鴉が鳴いたら／不完全愛情進行中／アンダードッグ |
| teresaAI | 5 | I Wanna Be Your Girl!／RED／Don't slow me down |
| ORESAMA | 2 | TREK TRUNK／CONTINEW WORLD |
| 雨宿り | 7 | ナインティーン／拝啓、五年前の僕へ／スターダスト |
| Albemuth | 4 | guilty／感光／新世界へ |
| 存流 | 7 | 存流 – 1st Album「ARU」／あおいゆめ／むーんらいとLIVE |
| Sooda | 1 | 甘党 |

---

## 7. 出处、缺口与已知矛盾

### 7.1 来源清单

| 来源 | 用途 | 等级 |
|---|---|---|
| [kamitsubaki.jp/discography/](https://kamitsubaki.jp/discography/) | 462 条发行记录（日期／类型／标题／艺人）；本文「官方条目」由此生成 | 【官方】 |
| 各专辑详情页（已抓取 46 页） | 收录曲、版本、价格 | 【官方】 |
| [NEWS《反転》公告](https://kamitsubaki.jp/news/2025/10/18/8803/) | 《反転》曲目与版本 | 【官方】 |
| [V.W.P 艺人页](https://kamitsubaki.jp/artist/v-w-p/) | 三分类定义、INTERVAL | 【官方】 |
| **网易云音乐艺人页**（花譜 id 32062601 等 13 位） | 官方列表漏项（专辑、EP、新单曲）与曲目 | 【平台】 |
| [少革官方 DISCOGRAPHY](https://girlsrevolutionproject.jp/discography/) | 心世紀／罪十罰／成员个人名义发行 49 条 | 【官方】 |
| QQ 音乐／哔哩哔哩 | **同口径备选复核渠道**（本次未逐一抓取，仅作方法论说明） | 【平台】 |
| 萌娘百科（花谱/理芽/春猿火/幸祜/异世界情绪/V.W.P/VALIS/CIEL/明透/琶舞/存流） | 逐曲表（投稿日、曲名、作词作曲编曲） | 【粉丝wiki】 |
| 本仓库 `docs/lore/research/` | 动画 OST 50 曲、乐曲集 13 曲、REGENERATE 曲目 | 【本仓库考据】 |

### 7.2 缺口（明写「未取得」，不用推测补全）

1. **V.W.P 的专辑编号**：官方称《反転》为 3rd，但《覚醒》《繁殖》的定位无法确认（见 §2.2）。
2. **心世紀／罪十罰的逐曲表**：少革官网给了 49 条发行（已抓），但**逐曲曲目未逐张抓取**；只有 1st Album《改変-心-/罪-》的曲目来自 KAMITSUBAKI 官方页。
3. **空爽、音楽的同位体的逐曲表**：空爽 EP《CYAN》的曲目已由平台取得；**音楽的同位体**仍只有曲数。
4. **平台专辑的曲目**：已为**明透／存流／琶舞／CIEL／空爽**抓取；VALIS 及其他艺人的平台专辑**仍只有曲数**。
5. **「原创曲」判定依赖萌百口径**：同曲可能在「投稿曲」与「专辑曲」两处出现；本文按「同日期+同曲名」去重，**跨来源仍可能重复**。
6. **日期差异**：官方发行日与萌百投稿日常不一致（如《戸惑いテレパシー》投稿 2020-06-08、官方发行 06-10），表中分区登记、不强行统一。

### 7.3 已知矛盾与易错点

| # | 事项 | 处理 |
|---|---|---|
| 1 | 萌百写 VALIS「解散」，官方为「無期限活動休止」 | **以官方为准** |
| 2 | 萌百把《夜が降り止む前に》《戸惑いテレパシー》当迷你专辑，官方标 Single | **以官方类型为准** |
| 3 | 「現象」是 LIVE 系列名，非曲名 | **不得当曲名引用** |
| 4 | V.W.P 系譜曲表内「魔女(真)」重复 | 去重后 **11 首**，表中保留两条并加注 |
| 5 | 平台日期普遍比官方早 1 天（如《反転》官方 01-21／平台 01-20） | **以官方日期为准**，平台日期仅在官方缺项时使用 |
| 6 | 萌百曲名混用简繁（花谱/花譜、异世界情绪/ヰ世界情緒） | **曲名照抄**，艺人名统一用官方日文表记 |
| 7 | 平台把翻唱单曲（covered by…）与原创曲混在同一 discography | 统计**原创曲时须剔除 cover**；本文原创曲表已不含 cover |

---

## 8. 对本作（K.U.P.）的使用建议

1. **可安全引用（【官方】）**：曲名、专辑名、V.W.P 三分类、动画 OP/ED 归属、REGENERATE 收录曲。
2. **需标注来源（【粉丝wiki】【平台】）**：逐曲投稿日、作词作曲编曲、平台补录专辑——写进代码注释时必须标来源，且不得当作官方设定。
3. **乐曲可用、设定不入（2026-10-18 决定）**：VALIS／心世紀／罪十罰／少革系谱的**乐曲可以用**（作 BGM、关卡曲、角色主题曲），**不必等官方并入**；但**设定仍不并入**——引曲不引设定，别把少革/VALIS 的角色与组织写进神椿市。
4. **可做玩法素材**：V.W.P 的「派生曲＝换对唱」可映射为双人合击；「系譜曲／拡声曲」的作曲家分野可映射为两套技能树风格。**映射本身属【本作自创】，需在代码注释标注。**
5. **命名纪律**：游戏内显示角色名（森先化歩…），乐曲以「曲名」出现，**不要把声优/中之人名写进曲目表**。

---

*本文档由官方 DISCOGRAPHY、网易云音乐与萌娘百科机器转录后人工校订；新增发行请同步更新 §1 计数与 §7.2 缺口。*
