const styleTitle: CSS = {
  display: "flex",
  alignItems: "center",
  ...theme.font14,
  color: theme.gray_text,
  whiteSpace: "nowrap",
  marginTop: "10px",
};
const styleNickname: CSS = {
  width: "100%",
  ...theme.font14,
  border: "none",
  outline: "none",
  borderRadius: "6px",
  padding: "6px 12px",
  marginLeft: "10px",
  background: theme.purple_light,
  boxShadow: theme.shadow_purple_input_inset,
};

const emailView = (title, contents) => `
  <style>
    .title {
      color: maroon;
    }
  </style>
  <div>
    <div class = "title">
      제목제목제목제목
    </div>
  </div>
`;
