export function getTileMotion(index, reducedMotion) {
  if (reducedMotion) {
    return { initial: false, transition: { duration: 0 } };
  }

  return {
    initial: { opacity: 0, scale: 0.88 },
    transition: {
      delay: Math.min(Math.max(0, index) * 0.025, 0.3),
      type: 'spring',
      stiffness: 320,
      damping: 22,
    },
  };
}
