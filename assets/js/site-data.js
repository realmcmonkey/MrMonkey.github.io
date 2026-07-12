const imageUrl = (file) => new URL(`../images/${file}`, document.currentScript.src).href;

const siteData = {
  name: "Mr. Monkey",
  brandName: "Monkey Fan Site",
  initials: "MM",
  role: "Minecraft & More",
  heroTitle: "Mr. Monkey",
  heroText: "Minecraft & More",
  youtubeChannel: "https://youtube.com/mrmonkeygaming",
  aboutTitle: "Welcome to the Mr. Monkey hub.",
  aboutText:
    "This site is being built as the main place for Mr. Monkey videos, Minecraft items, builds, custom projects, and anything new that gets added later.",
  contactCopy:
    "Send a message about Minecraft maps, videos, the website, or anything Mr. Monkey related. You can also follow along on YouTube and socials.",
  skills: [
    "Minecraft builds",
    "Minecraft items",
    "Gaming videos",
    "YouTube shorts",
    "Custom images",
    "Community posts",
  ],
  projects: [
    {
      title: "Minute to Win it: Minecraft Edition",
      category: "Creations",
      year: "Coming Soon",
      description:
        "Race against the clock in a collection of fast-paced 60-second Minecraft challenges inspired by Minute to Win It.",
      link: "/creations/minute-to-win-it/",
      image: imageUrl("minute-to-win-it-minecraft-edition.png"),
      progress: 25,
    },
    {
      title: "Diamond rush",
      category: "Creations",
      year: "2026",
      description:
        "Diamond Rush is an intense minigame where you have to mine as many diamond ores as you can and then smelt them to get diamonds.",
      link: "/creations/diamond-rush/",
      image: imageUrl("diamond-rush.png"),
    },
    {
      title: "X-Run Alpha",
      category: "Creations",
      year: "2026",
      description:
        "Speed Parkour where you have speed 25 or so, then you need to complete it without falling of the edge or getting trolled? can you do it? will you fail? find out now by Downloading Above",
      link: "/creations/x-run-alpha/",
      image: imageUrl("x-run-alpha.png"),
    },
    {
      title: "Monkey Skin Pack",
      category: "Skin Packs",
      year: "2026",
      description:
        "Have you ever wanted to be a monkey in Minecraft? Well, here's your chance with Santa Claus monkey, Easter monkey, dab police monkey and many others! Download it and try it out!",
      link: "/creations/monkey-skin-pack/",
      image: imageUrl("monkey-skin-pack.png"),
    },
  ],
  videos: [
    {
      title: "Latest Mr. Monkey Video",
      description: "The newest upload from the Mr. Monkey YouTube channel.",
      embedUrl:
        "https://www.youtube-nocookie.com/embed/videoseries?si=QKRCdzK75BEhk7h2&list=UURPfEI90TUrGycrAbqZUSTg",
      videoId: "",
      url: "https://youtube.com/mrmonkeygaming",
    },
    {
      title: "Minecraft Video Slot",
      description: "This can become a build video, short, tutorial, challenge, or channel trailer.",
      videoId: "",
      url: "https://youtube.com/mrmonkeygaming",
    },
  ],
  playlists: [],
  contactLinks: [
    {
      label: "YouTube",
      url: "https://youtube.com/mrmonkeygaming",
      icon: "https://cdn.simpleicons.org/youtube/FF0000",
    },
    {
      label: "Instagram",
      url: "https://instagram.com/realmcmonkey",
      icon: "https://cdn.simpleicons.org/instagram/E4405F",
    },
    {
      label: "X",
      url: "https://x.com/realmcmonkey",
      icon: "https://cdn.simpleicons.org/x/000000",
    },
  ],
};
