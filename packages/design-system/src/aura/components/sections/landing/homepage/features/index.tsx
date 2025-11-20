import { Feature } from 'data/landing/homepage';
import FeaturesHighlight from './highlights';
import FeaturesOverview from './overview';

const Features = ({ data }: { data: Feature[] }) => {
  return (
    <>
      <FeaturesOverview data={data} />
      <FeaturesHighlight />
    </>
  );
};

export default Features;
