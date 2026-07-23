const CHANGELOGS_DATA = [
    {
        id: "v1.0.0",
        version: "v1.0",
        title: "Bản Cập Nhật v1.0 — Cơ Chế Chiến Đấu, Sinh Vật & Lãnh Địa Làng Mạc 🍁",
        date: "23 Tháng 7, 2026",
        author: "ThinhDost",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ThinhDost",
        categories: ["feature", "performance"],
        summary: "Quá trình bảo trì đã hoàn tất! Bản cập nhật v1.0 mang đến hàng loạt mod Fabric mới cực xịn cải tiến cơ chế chiến đấu, vũ khí Netherite tối thượng, sinh vật mới, chiến hạm đại dương và tối ưu hiệu năng giảm giật lag tối đa.",
        image: "https://media.discordapp.net/attachments/1517927699123933325/1527937960903970906/image.png?ex=6a63121d&is=6a61c09d&hm=eac95cc2c595d9b241d789c22bc6f26a82b960fb6900fa161f0e9ee169721577&=&format=webp&quality=lossless",
        sections: [
            {
                heading: "🛡️ Bảo Vệ & Phát Triển Dân Làng",
                items: [
                    "<b>Guard Villagers:</b> Dân làng giờ đây đã biết trang bị tận răng và thuê lính gác bảo vệ dân làng khỏi quái vật.",
                    "<b>More Villagers & API:</b> Bổ sung thêm nhiều ngành nghề dân làng hoàn toàn mới, mở rộng khả năng giao dịch cày vật phẩm hiếm."
                ]
            },
            {
                heading: "⚔️ Trang Bị & Vũ Khí Tối Thượng",
                items: [
                    "<b>Advanced Netherite:</b> Khai mở các bậc nâng cấp Netherite mới giúp gia tăng chỉ số bộ giáp và công cụ tối thượng.",
                    "<b>Elemental Maces:</b> Bộ sưu tập chùy nguyên tố và các loại vũ khí cận chiến độc đáo với hiệu ứng đòn đánh cực đã."
                ]
            },
            {
                heading: "🦁 Sinh Vật & Thử Thách Mới",
                items: [
                    "<b>Friends and Foes:</b> Gặp gỡ những sinh vật huyền thoại từ các kỳ Mob Vote cũ cùng các loài quái vật mới đầy thách thức.",
                    "<b>Goblin Traders:</b> Thương nhân Goblin bí ẩn xuất hiện ngẫu nhiên dưới các tầng hang sâu với các giao dịch cực kỳ đặc biệt."
                ]
            }
        ]
    },
    {
        id: "v0.9.0",
        version: "v0.9",
        title: "Bản Cập Nhật v0.9 — Tối Ưu Hóa Mạng Async Engine & 20 TPS ⚡",
        date: "15 Tháng 7, 2026",
        author: "ThinhDost",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ThinhDost",
        categories: ["performance", "fix"],
        summary: "Nâng cấp hạ tầng máy chủ lên Folia Multi-threaded Async Engine, khắc phục triệt để tình trạng khựng lag khi có hơn 300 người chơi cùng lúc.",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
        sections: [
            {
                heading: "⚙️ Tối Ưu TPS & Khung Hình",
                items: [
                    "<b>Async Chunk Loading:</b> Tải chunk bất đồng bộ giúp người dùng lướt Elytra tốc độ cao không bị lag khựng.",
                    "<b>Entity Tracking Optimization:</b> Giảm 40% tài nguyên CPU tiêu thụ bởi farm quái quy mô lớn."
                ]
            },
            {
                heading: "🐛 Sửa Lỗi Tồn Đọng",
                items: [
                    "Sửa lỗi rớt vật phẩm khi teleport qua cổng Nether.",
                    "Khắc phục sự cố hiển thị sai skin khi đổi máy chủ phụ."
                ]
            }
        ]
    },
    {
        id: "v0.8.0",
        version: "v0.8",
        title: "Bản Cập Nhật v0.8 — Sự Kiện Đầm Lầy Bí Ẩn & Boss Rồng Mới 🐉",
        date: "01 Tháng 7, 2026",
        author: "AdminTeam",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=AdminTeam",
        categories: ["event", "feature"],
        summary: "Khai mở chiều không gian Nether mở rộng cùng hầm ngục Swamp Dungeon hoàn toàn mới với phần thưởng danh vọng vô cùng hấp dẫn.",
        image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200&auto=format&fit=crop",
        sections: [
            {
                heading: "🏆 Sự Kiện Hầm Ngục",
                items: [
                    "<b>Swamp Trial Chambers:</b> Thử thách 10 tầng hầm ngục quái vật với phần thưởng Huy Chương Huyền Thoại.",
                    "<b>World Boss Void Dragon:</b> Xuất hiện vào 20:00 mỗi cuối tuần tại vùng đất Ender."
                ]
            }
        ]
    },
    {
        id: "v0.7.0",
        version: "v0.7",
        title: "Bản Cập Nhật v0.7 — Cân Bằng Kinh Tế & Chợ Giao Dịch Dân Làng ⚖️",
        date: "18 Tháng 6, 2026",
        author: "EconomyDev",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=EconomyDev",
        categories: ["balance", "fix"],
        summary: "Điều chỉnh tỷ lệ rớt đồ ngọc lục bảo, làm mới hệ thống thuế giao dịch Marketplace và chống lạm phát nốt vàng.",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
        sections: [
            {
                heading: "⚖️ Cân Bằng Thị Trường",
                items: [
                    "<b>Villager Nerf:</b> Giới hạn 3 lần giảm giá sách phù phép từ dân làng để giữ giá trị cho cày cuốc.",
                    "<b>Auction House V2:</b> Giao diện đấu giá trực tuyến in-game nhanh chóng và bảo mật hơn."
                ]
            }
        ]
    }
];

const SNEAKPEEKS_DATA = [
    {
        id: "sp-1",
        title: "Sneak Peek: Ra Mắt Hàng Loạt Vũ Khí Cận Chiến Độc Quyền Cực Khủng ⚔️",
        date: "25 Tháng 7, 2026",
        type: "image",
        imageUrl: "https://media.discordapp.net/attachments/1517927699123933325/1529484154222153748/image.png?ex=6a636c1e&is=6a621a9e&hm=42f3c123e8dad9c319469c5be1c7369a2b699136cd574e609572d26cfebe7577&=&format=webp&quality=lossless",
        summary: `• Chiêm ngưỡng bộ sưu tập vũ khí cận chiến thế hệ mới được chế tạo tinh xảo từ các khoáng sản quý hiếm nhất.

• Giới thiệu các loại chùy nguyên tố (Elemental Maces) và thương dài độc quyền đi kèm hiệu ứng kỹ năng chiến đấu đẹp mắt.

• Hệ thống chỉ số và cấp bậc cường hóa vũ khí đa dạng mở khóa sức mạnh chiến đấu tối thượng cho người chơi.`
    },
    {
        id: "sp-3",
        title: "Sneak Peek: Chinh Phục Pháo Đài Băng Giá Khổng Lồ & Hầm Ngục Thử Thách ❄️",
        date: "20 Tháng 7, 2026",
        type: "video",
        youtubeUrl: "https://youtu.be/UEIVctxN8HM",
        summary: `• Khám phá pháo đài băng khổng lồ nằm ẩn sâu trong quần xã tuyết rơi với kiến trúc thành lũy kiên cố, đồ sộ.

• Thử thách bản thân với hệ thống phòng ngự hầm ngục băng giá (Ice Dungeon Trials) đầy rẫy các loài quái vật bị biến dị.

• Vượt qua các cạm bẫy đóng băng trơn trượt để săn lùng rương báu cổ chứa trang bị kháng hiệu ứng Băng cực hiếm.`
    },
    {
        id: "sp-2",
        title: "Sneak Peek: Khám Phá Cấu Trúc Pháo Đài The End Cổ Đại Mới 🌌",
        date: "15 Tháng 7, 2026",
        type: "video",
        youtubeUrl: "https://www.youtube.com/watch?v=1KBawkX0JsI",
        summary: `• Xem trước pháo đài The End cổ đại sắp mở cửa tại OlongBell Server với thiết kế mê cung bay lơ lửng hoành tráng.

• Bổ sung quần thể bảo vệ Shulker tối tân bảo vệ rương vật phẩm cổ xưa chứa Elytra nguyên bản cải tiến.

• Hệ thống bẫy rập nguy hiểm thách thức kỹ năng parkour và các phòng thí nghiệm chế tạo lọ thuốc quý giá.`
    }
];


