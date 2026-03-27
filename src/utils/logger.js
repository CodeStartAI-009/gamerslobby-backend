// backend/utils/logger.js

const levels = {
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
  };
  
  function format(level, message, meta) {
    const time = new Date().toISOString();
    return `${levels[level]} [${time}] ${message} ${
      meta ? JSON.stringify(meta) : ""
    }`;
  }
  
  function info(message, meta) {
    console.log(format("info", message, meta));
  }
  
  function warn(message, meta) {
    console.warn(format("warn", message, meta));
  }
  
  function error(message, meta) {
    console.error(format("error", message, meta));
  }
  
  module.exports = {
    info,
    warn,
    error,
  };