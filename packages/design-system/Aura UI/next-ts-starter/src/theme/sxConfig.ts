export default {
  lineClamp: {
    style: (props: Record<string, any>) => {
      const lineClamp = props.lineClamp ?? 1;
      return {
        display: '-webkit-box',
        WebkitLineClamp: String(lineClamp),
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      };
    },
  },
};
