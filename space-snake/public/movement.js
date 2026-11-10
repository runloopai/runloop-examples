(function(root) {
  const movement = {
    SPEED: 300,
    BOOST_SPEED: 540,
    TURN_RATE: 8,
    step(s, target, boost, dt) {
      const diff = Math.atan2(Math.sin(target - s.a), Math.cos(target - s.a));
      s.a += Math.max(-this.TURN_RATE * dt, Math.min(this.TURN_RATE * dt, diff));
      const speed = boost ? this.BOOST_SPEED : this.SPEED;
      s.x += Math.cos(s.a) * speed * dt;
      s.y += Math.sin(s.a) * speed * dt;
    }
  };
  if (typeof module !== 'undefined') module.exports = movement;
  else root.Movement = movement;
})(globalThis);
