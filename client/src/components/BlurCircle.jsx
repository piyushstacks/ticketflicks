const BlurCircle = ({
  top = "auto",
  left = "auto",
  right = "auto",
  bottom = "auto",
}) => {
  return (
    <div
      className="absolute -z-50 h-48 w-48 rounded-full blur-[100px]"
      style={{
        top,
        left,
        right,
        bottom,
        backgroundColor: "var(--color-accent)",
        opacity: "var(--blur-glow-opacity)",
      }}
    />
  );
};

export default BlurCircle;
