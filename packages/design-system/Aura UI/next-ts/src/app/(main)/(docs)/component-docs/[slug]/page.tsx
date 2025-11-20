import componentDocs from 'data/docs';

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  return componentDocs[slug];
};

export default Page;
