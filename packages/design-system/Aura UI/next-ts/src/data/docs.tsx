import { JSX } from 'react';
// Component Docs
import AccordionDoc from 'docs/component-docs/AccordionDoc';
import AlertDoc from 'docs/component-docs/AlertDoc';
import AppBarDoc from 'docs/component-docs/AppBarDoc';
import AutocompleteDoc from 'docs/component-docs/AutocompleteDoc';
import AvatarDoc from 'docs/component-docs/AvatarDoc';
import BackdropDoc from 'docs/component-docs/BackdropDoc';
import BadgeDoc from 'docs/component-docs/BadgeDoc';
import BottomNavigationDoc from 'docs/component-docs/BottomNavigationDoc';
import BoxDoc from 'docs/component-docs/BoxDoc';
import BreadcrumbsDoc from 'docs/component-docs/BreadcrumbsDoc';
import ButtonDoc from 'docs/component-docs/ButtonDoc';
import ButtonGroupDoc from 'docs/component-docs/ButtonGroupDoc';
import CardDoc from 'docs/component-docs/CardDoc';
import CheckboxDoc from 'docs/component-docs/CheckboxDoc';
import ChipDoc from 'docs/component-docs/ChipDoc';
import ContainerDoc from 'docs/component-docs/ContainerDoc';
import DataGridDoc from 'docs/component-docs/DataGridDoc';
import DateRangePickerDoc from 'docs/component-docs/DateRangePickerDoc';
import DateTimePickersDoc from 'docs/component-docs/DateTimePickersDoc';
import DialogDoc from 'docs/component-docs/DialogDoc';
import DividerDoc from 'docs/component-docs/DividerDoc';
import DrawerDoc from 'docs/component-docs/DrawerDoc';
import EditorDoc from 'docs/component-docs/EditorDoc';
import EmojiPickerDoc from 'docs/component-docs/EmojiPickerDoc';
import FabDoc from 'docs/component-docs/FabDoc';
import FileUploaderDoc from 'docs/component-docs/FileUploaderDoc';
import GridDoc from 'docs/component-docs/GridDoc';
import IconDoc from 'docs/component-docs/IconDoc';
import ImageListDoc from 'docs/component-docs/ImageListDoc';
import LightboxDoc from 'docs/component-docs/LightboxDoc';
import LinkDoc from 'docs/component-docs/LinkDoc';
import ListDoc from 'docs/component-docs/ListDoc';
import MenuDoc from 'docs/component-docs/MenuDoc';
import ModalDoc from 'docs/component-docs/ModalDoc';
import PaginationDoc from 'docs/component-docs/PaginationDoc';
import PaperDoc from 'docs/component-docs/PaperDoc';
import PopoverDoc from 'docs/component-docs/PopoverDoc';
import PopperDoc from 'docs/component-docs/PopperDoc';
import ProgressDoc from 'docs/component-docs/ProgressDoc';
import RadioDoc from 'docs/component-docs/RadioDoc';
import RatingDoc from 'docs/component-docs/RatingDoc';
import ResizableDoc from 'docs/component-docs/ResizableDoc';
import ScrollbarDoc from 'docs/component-docs/ScrollbarDoc';
import SelectDoc from 'docs/component-docs/SelectDoc';
import SkeletonDoc from 'docs/component-docs/SkeletonDoc';
import SliderDoc from 'docs/component-docs/SliderDoc';
import SnackbarDoc from 'docs/component-docs/SnackbarDoc';
import SpeedDialDoc from 'docs/component-docs/SpeedDialDoc';
import StackDoc from 'docs/component-docs/StackDoc';
import StepperDoc from 'docs/component-docs/StepperDoc';
import SwiperDoc from 'docs/component-docs/SwiperDoc';
import SwitchDoc from 'docs/component-docs/SwitchDoc';
import TableDoc from 'docs/component-docs/TableDoc';
import TabsDoc from 'docs/component-docs/TabsDoc';
import TextFieldDoc from 'docs/component-docs/TextFieldDoc';
import TimelineDoc from 'docs/component-docs/TimelineDoc';
import ToggleButtonDoc from 'docs/component-docs/ToggleButtonDoc';
import TooltipDoc from 'docs/component-docs/TooltipDoc';
import TransferListDoc from 'docs/component-docs/TransferListDoc';
import TypographyDoc from 'docs/component-docs/TypographyDoc';
import EChartsDoc from 'docs/component-docs/echarts';
// Documentation
import ApiCalls from 'docs/documentation/ApiCalls';
import Authentication from 'docs/documentation/Authentication';
import Changelog from 'docs/documentation/Changelog';
import Configuration from 'docs/documentation/Configuration';
import Dependencies from 'docs/documentation/DependenciesTable';
import FolderStructure from 'docs/documentation/FolderStructure';
import GettingStarted from 'docs/documentation/GettingStarted';
import IconRegistration from 'docs/documentation/IconRegistration';
import Introduction from 'docs/documentation/Introduction';
import Layouts from 'docs/documentation/Layouts';
import Localization from 'docs/documentation/Localization';
import Migration from 'docs/documentation/Migration';
import Routing from 'docs/documentation/Routing';
import Theming from 'docs/documentation/Theming';

const componentDocs: Record<string, JSX.Element> = {
  accordion: <AccordionDoc />,
  alert: <AlertDoc />,
  'app-bar': <AppBarDoc />,
  autocomplete: <AutocompleteDoc />,
  avatar: <AvatarDoc />,
  backdrop: <BackdropDoc />,
  badge: <BadgeDoc />,
  'bottom-navigation': <BottomNavigationDoc />,
  box: <BoxDoc />,
  breadcrumbs: <BreadcrumbsDoc />,
  button: <ButtonDoc />,
  'button-group': <ButtonGroupDoc />,
  card: <CardDoc />,
  checkbox: <CheckboxDoc />,
  chip: <ChipDoc />,
  container: <ContainerDoc />,
  'data-grid': <DataGridDoc />,
  'date-range-picker': <DateRangePickerDoc />,
  'date-time-pickers': <DateTimePickersDoc />,
  dialog: <DialogDoc />,
  divider: <DividerDoc />,
  drawer: <DrawerDoc />,
  echarts: <EChartsDoc />,
  editor: <EditorDoc />,
  'emoji-picker': <EmojiPickerDoc />,
  'file-uploader': <FileUploaderDoc />,
  'floating-action-button': <FabDoc />,
  grid: <GridDoc />,
  icon: <IconDoc />,
  'image-list': <ImageListDoc />,
  lightbox: <LightboxDoc />,
  link: <LinkDoc />,
  list: <ListDoc />,
  menu: <MenuDoc />,
  modal: <ModalDoc />,
  pagination: <PaginationDoc />,
  paper: <PaperDoc />,
  popover: <PopoverDoc />,
  popper: <PopperDoc />,
  progress: <ProgressDoc />,
  radio: <RadioDoc />,
  rating: <RatingDoc />,
  resizable: <ResizableDoc />,
  scrollbar: <ScrollbarDoc />,
  select: <SelectDoc />,
  skeleton: <SkeletonDoc />,
  slider: <SliderDoc />,
  snackbar: <SnackbarDoc />,
  'speed-dial': <SpeedDialDoc />,
  stack: <StackDoc />,
  stepper: <StepperDoc />,
  swiper: <SwiperDoc />,
  switch: <SwitchDoc />,
  table: <TableDoc />,
  tabs: <TabsDoc />,
  textfield: <TextFieldDoc />,
  timeline: <TimelineDoc />,
  'toggle-button': <ToggleButtonDoc />,
  tooltip: <TooltipDoc />,
  'transfer-list': <TransferListDoc />,
  typography: <TypographyDoc />,
};

export const documentation: Record<string, JSX.Element> = {
  'api-calls': <ApiCalls />,
  authentication: <Authentication />,
  changelog: <Changelog />,
  configuration: <Configuration />,
  dependencies: <Dependencies />,
  'folder-structure': <FolderStructure />,
  'getting-started': <GettingStarted />,
  introduction: <Introduction />,
  layouts: <Layouts />,
  localization: <Localization />,
  migration: <Migration />,
  routing: <Routing />,
  theming: <Theming />,
  icons: <IconRegistration />,
};

export default componentDocs;
