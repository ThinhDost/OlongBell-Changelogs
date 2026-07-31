var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
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
        user = { id: cachedData };
      }
    } catch (e) {
      user = { id: cachedData };
    }
  }
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
      avatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.id) % 5}.png`
    };
    await env.OLONGBELL_KV.put(tokenCacheKey, JSON.stringify(user), { expirationTtl: 600 });
  }
  return user;
}
__name(getDiscordUser, "getDiscordUser");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
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
        const lastReactKey = `last_react:${userId}`;
        const lastReactTime = await env.OLONGBELL_KV.get(lastReactKey);
        const now = Date.now();
        if (lastReactTime && now - parseInt(lastReactTime) < 1e3) {
          return new Response(JSON.stringify({ error: "Too Many Requests: Vui l\xF2ng \u0111\u1EE3i 1 gi\xE2y gi\u1EEFa c\xE1c l\u01B0\u1EE3t th\u1EA3 tim!" }), {
            status: 429,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        await env.OLONGBELL_KV.put(lastReactKey, now.toString());
        const { logId, type } = await request.json();
        if (!logId || !["like", "love", "fire"].includes(type)) {
          return new Response(JSON.stringify({ error: "Bad Request: Invalid logId or type" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        const userReactKey = `user_react:${userId}:${logId}`;
        const previousType = await env.OLONGBELL_KV.get(userReactKey);
        let globalReactions = await env.OLONGBELL_KV.get("reactions:global", "json");
        if (!globalReactions) {
          globalReactions = {};
        }
        if (!globalReactions[logId]) {
          globalReactions[logId] = { like: 0, love: 0, fire: 0 };
        }
        let userReaction = null;
        if (previousType === type) {
          await env.OLONGBELL_KV.delete(userReactKey);
          globalReactions[logId][type] = Math.max(0, (globalReactions[logId][type] || 0) - 1);
          userReaction = null;
        } else {
          if (previousType) {
            globalReactions[logId][previousType] = Math.max(0, (globalReactions[logId][previousType] || 0) - 1);
          }
          globalReactions[logId][type] = (globalReactions[logId][type] || 0) + 1;
          await env.OLONGBELL_KV.put(userReactKey, type);
          userReaction = type;
        }
        await env.OLONGBELL_KV.put("reactions:global", JSON.stringify(globalReactions));
        return new Response(JSON.stringify({
          allReactions: globalReactions,
          userReaction
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
    if (request.method === "POST" && url.pathname === "/api/submit-mod") {
      try {
        const user = await getDiscordUser(request, env);
        if (!user) {
          return new Response(JSON.stringify({ error: "Unauthorized: Invalid Discord token" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        const lastSubmitKey = `last_submit_mod:${user.id}`;
        const lastSubmitTime = await env.OLONGBELL_KV.get(lastSubmitKey);
        const now = Date.now();
        if (lastSubmitTime && now - parseInt(lastSubmitTime) < 3e3) {
          return new Response(JSON.stringify({ error: "Too Many Requests: Vui l\xF2ng \u0111\u1EE3i 3 gi\xE2y gi\u1EEFa c\xE1c l\u01B0\u1EE3t \u0111\u1EC1 xu\u1EA5t!" }), {
            status: 429,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        await env.OLONGBELL_KV.put(lastSubmitKey, now.toString());
        let { name, url: modUrl } = await request.json();
        if (!name || !modUrl) {
          return new Response(JSON.stringify({ error: "Bad Request: Thi\u1EBFu t\xEAn mod ho\u1EB7c link \u0111\u1EC1 xu\u1EA5t!" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        name = name.trim();
        modUrl = modUrl.trim();
        if (name.length < 2 || name.length > 60) {
          return new Response(JSON.stringify({ error: "T\xEAn mod ph\u1EA3i t\u1EEB 2 \u0111\u1EBFn 60 k\xFD t\u1EF1!" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        let isValidUrl = false;
        try {
          const parsed = new URL(modUrl);
          const hostname = parsed.hostname.replace("www.", "");
          if (hostname === "curseforge.com") {
            isValidUrl = parsed.pathname.includes("/mc-mods/");
          } else if (hostname === "modrinth.com") {
            isValidUrl = parsed.pathname.includes("/mod/") || parsed.pathname.includes("/project/");
          }
        } catch (e) {
        }
        if (!isValidUrl) {
          return new Response(JSON.stringify({ error: "\u0110\u01B0\u1EDDng d\u1EABn kh\xF4ng h\u1EE3p l\u1EC7! Ch\u1EC9 ch\u1EA5p nh\u1EADn link t\u1EEB curseforge.com ho\u1EB7c modrinth.com." }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        let mods = await env.OLONGBELL_KV.get("vote:mods", "json");
        if (!mods) {
          mods = [];
        }
        const isDuplicate = mods.some((m) => {
          try {
            const u1 = new URL(m.url);
            const u2 = new URL(modUrl);
            return u1.pathname === u2.pathname;
          } catch (e) {
            return m.url === modUrl;
          }
        });
        if (isDuplicate) {
          return new Response(JSON.stringify({ error: "Mod n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u1EC1 xu\u1EA5t tr\u01B0\u1EDBc \u0111\xF3!" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        const newMod = {
          id: crypto.randomUUID(),
          name,
          url: modUrl,
          suggestedBy: user.username,
          avatar: user.avatar,
          voters: [user.id]
          // Tự động vote cho mod mình đề xuất
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
          return new Response(JSON.stringify({ error: "Bad Request: Thi\u1EBFu ID mod!" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
        let mods = await env.OLONGBELL_KV.get("vote:mods", "json");
        if (!mods) {
          mods = [];
        }
        const modIndex = mods.findIndex((m) => m.id === modId);
        if (modIndex === -1) {
          return new Response(JSON.stringify({ error: "Mod kh\xF4ng t\u1ED3n t\u1EA1i!" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS }
          });
        }
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
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
