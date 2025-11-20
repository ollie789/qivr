import { documentation } from 'data/docs';

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  return documentation[slug];
};

export default Page;
