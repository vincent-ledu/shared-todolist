module.exports = {
  apps: [
    {
      script: "app.js",
      watch: ".",
      ignore_watch : ["node_modules", "todo.txt"]
    }    
  ],
};
