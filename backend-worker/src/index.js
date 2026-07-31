const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

async function getDiscordUser(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  const tokenCacheKey = `token_cache:${token}`;
  
  let cachedData = await env.OLONGBELL_KV.get(tokenCacheKey);
  let user = null;
  if (cachedData) {
    try {
      if (cachedData.startsWith("{")) {
        user = JSON.parse(cachedData);
      } else {
        // Old token cache format containing only userId string
        user = { id: cachedData };
      }
    } catch (e) {
      user = { id: cachedData };
    }
  }

  // If not cached or if it's an old cache format that doesn't have username/avatar,
  // fetch from Discord to get complete profile details.
  if (!user || !user.username) {
    const discordRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!discordRes.ok) {
      return null;
    }

    const discordUser = await discordRes.json();
    user = {
      id: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar 
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.id) % 5}.png`
    };

    await env.OLONGBELL_KV.put(tokenCacheKey, JSON.stringify(user), { expirationTtl: 600 });
  }
  return user;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Xử lý CORS Preflight Request
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // 1. API GET /api/reactions - Lấy số lượng thả tim toàn cục
    if (request.method === "GET" && url.pathname === "/api/reactions") {
      try {
        let reactions = await env.OLONGBELL_KV.get("reactions:global", "json");
        if (!reactions) {
          reactions = {};
        }
        return new Response(JSON.stringify(reactions), {
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS }
        });
      }
    }

    // 2. API POST /api/react - Thả/Hủy thả tim (yêu cầu Discord token)
    if (request.method === "POST" && url.pathname === "/api/react") {
      try {
        const user = await getDiscordUser(request, env);
        if (!user) {
          return new Response(JSON.stringify({ error: "Unauthorized: Invalid Discord token" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        const userId = user.id;

        // 2. Kiểm tra Rate Limit chống spam (giới hạn tối thiểu 1 giây giữa mỗi lượt tương tác của 1 user)
        const lastReactKey = `last_react:${userId}`;
        const lastReactTime = await env.OLONGBELL_KV.get(lastReactKey);
        const now = Date.now();
        if (lastReactTime && (now - parseInt(lastReactTime)) < 1000) {
          return new Response(JSON.stringify({ error: "Too Many Requests: Vui lòng đợi 1 giây giữa các lượt thả tim!" }), {
            status: 429,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        // Ghi nhận thời điểm tương tác mới
        await env.OLONGBELL_KV.put(lastReactKey, now.toString());

        // Đọc dữ liệu gửi lên từ body
        const { logId, type } = await request.json();
        if (!logId || !["like", "love", "fire"].includes(type)) {
          return new Response(JSON.stringify({ error: "Bad Request: Invalid logId or type" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }

        // Tạo key lưu reaction cá nhân: user_react:<userId>:<logId>
        const userReactKey = `user_react:${userId}:${logId}`;
        const previousType = await env.OLONGBELL_KV.get(userReactKey);

        // Lấy danh sách reactions toàn cục hiện tại
        let globalReactions = await env.OLONGBELL_KV.get("reactions:global", "json");
        if (!globalReactions) {
          globalReactions = {};
        }
        if (!globalReactions[logId]) {
          globalReactions[logId] = { like: 0, love: 0, fire: 0 };
        }

        let userReaction = null;

        if (previousType === type) {
          // Bấm trùng loại -> Hủy thả tim (Toggle off)
          await env.OLONGBELL_KV.delete(userReactKey);
          globalReactions[logId][type] = Math.max(0, (globalReactions[logId][type] || 0) - 1);
          userReaction = null;
        } else {
          // Đổi loại tim hoặc lần đầu thả tim
          if (previousType) {
            // Giảm số lượng của loại tim cũ
            globalReactions[logId][previousType] = Math.max(0, (globalReactions[logId][previousType] || 0) - 1);
          }
          // Tăng số lượng của loại tim mới
          globalReactions[logId][type] = (globalReactions[logId][type] || 0) + 1;
          
          await env.OLONGBELL_KV.put(userReactKey, type);
          userReaction = type;
        }

        // Lưu danh sách reaction toàn cục mới vào KV
        await env.OLONGBELL_KV.put("reactions:global", JSON.stringify(globalReactions));

        return new Response(JSON.stringify({
          allReactions: globalReactions,
          userReaction: userReaction
        }), {
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS
          }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS }
        });
      }
    }

    // 3. API GET /api/votes - Lấy danh sách mod đề xuất và lượt vote
    if (request.method === "GET" && url.pathname === "/api/votes") {
      try {
        let mods = await env.OLONGBELL_KV.get("vote:mods", "json");
        if (!mods) {
          mods = [];
        }
        return new Response(JSON.stringify(mods), {
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS }
        });
      }
    }

    // 4. API POST /api/submit-mod - Đề xuất mod mới
    if (request.method === "POST" && url.pathname === "/api/submit-mod") {
      try {
        const user = await getDiscordUser(request, env);
        if (!user) {
          return new Response(JSON.stringify({ error: "Unauthorized: Invalid Discord token" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }

        // Kiểm tra Rate Limit chống spam (giới hạn tối thiểu 3 giây giữa mỗi lượt đề xuất mod)
        const lastSubmitKey = `last_submit_mod:${user.id}`;
        const lastSubmitTime = await env.OLONGBELL_KV.get(lastSubmitKey);
        const now = Date.now();
        if (lastSubmitTime && (now - parseInt(lastSubmitTime)) < 3000) {
          return new Response(JSON.stringify({ error: "Too Many Requests: Vui lòng đợi 3 giây giữa các lượt đề xuất!" }), {
            status: 429,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        await env.OLONGBELL_KV.put(lastSubmitKey, now.toString());

        let { name, url: modUrl } = await request.json();
        if (!name || !modUrl) {
          return new Response(JSON.stringify({ error: "Bad Request: Thiếu tên mod hoặc link đề xuất!" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }

        name = name.trim();
        modUrl = modUrl.trim();

        if (name.length < 2 || name.length > 60) {
          return new Response(JSON.stringify({ error: "Tên mod phải từ 2 đến 60 ký tự!" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }

        // Kiểm tra định dạng link CurseForge hoặc Modrinth
        let isValidUrl = false;
        try {
          const parsed = new URL(modUrl);
          const hostname = parsed.hostname.replace('www.', '');
          if (hostname === 'curseforge.com') {
            isValidUrl = parsed.pathname.includes('/mc-mods/');
          } else if (hostname === 'modrinth.com') {
            isValidUrl = parsed.pathname.includes('/mod/') || parsed.pathname.includes('/project/');
          }
        } catch (e) {}

        if (!isValidUrl) {
          return new Response(JSON.stringify({ error: "Đường dẫn không hợp lệ! Chỉ chấp nhận link từ curseforge.com hoặc modrinth.com." }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }

        // Lấy danh sách mod đề xuất hiện tại
        let mods = await env.OLONGBELL_KV.get("vote:mods", "json");
        if (!mods) {
          mods = [];
        }

        // Kiểm tra xem URL đã được đề xuất chưa
        const isDuplicate = mods.some(m => {
          try {
            const u1 = new URL(m.url);
            const u2 = new URL(modUrl);
            return u1.pathname === u2.pathname;
          } catch (e) {
            return m.url === modUrl;
          }
        });

        if (isDuplicate) {
          return new Response(JSON.stringify({ error: "Mod này đã được đề xuất trước đó!" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }

        // Tạo mod mới
        const newMod = {
          id: crypto.randomUUID(),
          name,
          url: modUrl,
          suggestedBy: user.username,
          avatar: user.avatar,
          voters: [user.id] // Tự động vote cho mod mình đề xuất
        };

        mods.push(newMod);
        await env.OLONGBELL_KV.put("vote:mods", JSON.stringify(mods));

        return new Response(JSON.stringify(mods), {
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS
          }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS }
        });
      }
    }

    // 5. API POST /api/vote-mod - Bình chọn cho mod
    if (request.method === "POST" && url.pathname === "/api/vote-mod") {
      try {
        const user = await getDiscordUser(request, env);
        if (!user) {
          return new Response(JSON.stringify({ error: "Unauthorized: Invalid Discord token" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }

        const { modId } = await request.json();
        if (!modId) {
          return new Response(JSON.stringify({ error: "Bad Request: Thiếu ID mod!" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }

        // Lấy danh sách mod
        let mods = await env.OLONGBELL_KV.get("vote:mods", "json");
        if (!mods) {
          mods = [];
        }

        const modIndex = mods.findIndex(m => m.id === modId);
        if (modIndex === -1) {
          return new Response(JSON.stringify({ error: "Mod không tồn tại!" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }

        // Toggle vote
        const mod = mods[modIndex];
        if (!mod.voters) {
          mod.voters = [];
        }

        const voterIndex = mod.voters.indexOf(user.id);
        if (voterIndex === -1) {
          mod.voters.push(user.id);
        } else {
          mod.voters.splice(voterIndex, 1);
        }

        await env.OLONGBELL_KV.put("vote:mods", JSON.stringify(mods));

        return new Response(JSON.stringify(mods), {
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS
          }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS }
        });
      }
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });
  }
};
