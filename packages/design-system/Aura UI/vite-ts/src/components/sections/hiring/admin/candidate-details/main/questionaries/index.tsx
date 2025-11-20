import { useState } from 'react';
import Stack from '@mui/material/Stack';
import { initialConfig } from 'config';
import CollapsibleSection from './CollapsibleSection';
import QuestionItem from './QuestionItem';

const auroraBeam = `${initialConfig.assetsDir}/videos/file-manager/aurora.mp4`;

interface Option {
  value: string;
  label: string;
}

interface BaseQuestion {
  question: string;
}

interface TextQuestion extends BaseQuestion {
  answer: string;
  type?: undefined;
  options?: undefined;
}

interface RadioQuestion extends BaseQuestion {
  answer: string;
  type: 'radio';
  options: Option[];
}

interface CheckboxQuestion extends BaseQuestion {
  answer: string;
  type: 'checkbox';
  options: Option[];
}

interface VideoQuestion extends BaseQuestion {
  answer: string;
  type: 'video';
  options?: undefined;
}

type Question = TextQuestion | RadioQuestion | CheckboxQuestion | VideoQuestion;

interface Questionaries {
  preScreenQuestions: Question[];
  videoResponse: VideoQuestion[];
}

interface OpenSections {
  preScreen: boolean;
  videoResponse: boolean;
}

const questionaries: Questionaries = {
  preScreenQuestions: [
    {
      question: 'Why did you choose to apply to this company?',
      answer:
        "I applied to this company because of its strong reputation for innovation and quality in content creation. The company's values align with my passion for storytelling and delivering engaging content. I am excited about the opportunity to contribute my writing expertise to a team that values creativity and impact.",
    },
    {
      question: 'What are your greatest strengths?',
      answer:
        'Strong research skills, adaptability in writing styles, SEO expertise, and the ability to create engaging, audience-focused content.',
    },
    {
      question: 'How do you prefer to work on tasks?',
      answer: 'independently',
      type: 'radio',
      options: [
        { value: 'independently', label: 'Independently' },
        { value: 'collaboratively', label: 'Collaboratively' },
        { value: 'deadlines', label: 'With clear deadlines' },
        { value: 'freedom', label: 'With creative freedom' },
      ],
    },
    {
      question: 'Have you worked remotely before?',
      answer: 'yes',
      type: 'checkbox',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
  ],
  videoResponse: [
    {
      question: 'Why did you choose to apply to this company?',
      answer: auroraBeam,
      type: 'video',
    },
    {
      question: 'What are your greatest strengths?',
      answer: auroraBeam,
      type: 'video',
    },
    {
      question: 'How do you prefer to work on tasks?',
      answer: auroraBeam,
      type: 'video',
    },
  ],
};

const Questionaries = () => {
  const [openSections, setOpenSections] = useState<OpenSections>({
    preScreen: true,
    videoResponse: true,
  });

  const handleToggle = (section: keyof OpenSections): void => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <Stack direction="column" gap={5} sx={{ height: 1 }}>
      <CollapsibleSection
        title="Pre-Screen Questions"
        isOpen={openSections.preScreen}
        onToggle={() => handleToggle('preScreen')}
      >
        {questionaries.preScreenQuestions.map((item: Question, index: number) => (
          <QuestionItem
            key={index}
            question={item.question}
            answer={item.answer}
            type={item.type}
            options={item.options}
            index={index}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection
        title="Video Response"
        isOpen={openSections.videoResponse}
        onToggle={() => handleToggle('videoResponse')}
        sx={{ mb: 0 }}
      >
        {questionaries.videoResponse.map((item: VideoQuestion, index: number) => (
          <QuestionItem
            key={index}
            question={item.question}
            answer={item.answer}
            type={item.type}
            options={item.options}
            index={index}
          />
        ))}
      </CollapsibleSection>
    </Stack>
  );
};

export default Questionaries;
