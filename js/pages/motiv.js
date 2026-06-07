const MotivPage = {
  render() {
    return `
<div style="
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  min-height:calc(100vh - 180px);
  text-align:center;
  padding:40px 24px;
  position:relative;
">
  <div style="max-width:800px">
    <p style="
      font-size:clamp(2rem,5vw,4rem);
      font-weight:800;
      letter-spacing:0.06em;
      color:#fff;
      text-shadow:0 0 60px rgba(79,110,247,0.6), 0 2px 20px rgba(0,0,0,0.8);
      margin-bottom:28px;
      line-height:1.15;
    ">No excuses, just do it.</p>

    <p style="
      font-size:clamp(1rem,2.5vw,1.6rem);
      font-weight:400;
      color:rgba(255,255,255,0.6);
      letter-spacing:0.12em;
      line-height:1.8;
    ">言い訳はいらない。行動あるのみ。</p>
  </div>

  <div style="
    position:fixed;
    bottom:28px;
    right:32px;
    text-align:right;
    font-size:11.5px;
    color:rgba(255,255,255,0.28);
    letter-spacing:0.06em;
    line-height:1.8;
  ">
    <div>製作者</div>
    <div>加藤光祐，金森匠哉</div>
  </div>
</div>`;
  },

  mount() {}
};
