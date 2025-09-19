import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import {
  ASSISTANT_WORKFLOW_MODAL_SIZE,
  ASSISTANT_WORKFLOW_TAB_CONFIG,
  ASSISTANT_WORKFLOW_TEXT_COLOR
} from "./componentTokens.js";

export default function AssistantWorkflowModal({
  isOpen,
  onClose,
  tabIndex,
  onTabChange,
  exportText,
  onCopyExport,
  hasCopiedExport,
  inputValue,
  onInputChange,
  error,
  canSave,
  onSave,
  isSaving
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={ASSISTANT_WORKFLOW_MODAL_SIZE} closeOnOverlayClick={!isSaving} closeOnEsc={!isSaving}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Assistant workflow</ModalHeader>
        <ModalCloseButton isDisabled={isSaving} />
        <ModalBody>
          <Tabs index={tabIndex} onChange={onTabChange} isLazy isFitted variant="enclosed">
            <TabList>
              {ASSISTANT_WORKFLOW_TAB_CONFIG.map((tab) => (
                <Tab key={tab.value}>{tab.label}</Tab>
              ))}
            </TabList>
            <TabPanels>
              <TabPanel px={0} pt={4} pb={2}>
                <Box as="div">
                  <Text fontSize="sm" color={ASSISTANT_WORKFLOW_TEXT_COLOR} mb={4}>
                    Share this prompt package with your LLM assistant. It combines a short briefing with your data so the model
                    understands what to do before editing projects and tasks.
                  </Text>
                  <Button
                    size="sm"
                    variant={hasCopiedExport ? "solid" : "outline"}
                    colorScheme={hasCopiedExport ? "green" : "purple"}
                    leftIcon={<CopyIcon />}
                    onClick={onCopyExport}
                  >
                    {hasCopiedExport ? "Copied" : "Copy JSON"}
                  </Button>
                  <Box
                    as="pre"
                    w="full"
                    maxH="420px"
                    overflow="auto"
                    fontFamily="mono"
                    fontSize="sm"
                    bg="gray.900"
                    color="green.100"
                    borderRadius="lg"
                    px={4}
                    py={4}
                    mt={4}
                  >
                    {exportText}
                  </Box>
                </Box>
              </TabPanel>
              <TabPanel px={0} pt={4} pb={2}>
                <Text fontSize="sm" color={ASSISTANT_WORKFLOW_TEXT_COLOR} mb={4}>
                  Paste the assistant output below. JSON arrays, JSONL exports, or operation payloads are accepted. We validate every change before applying.
                </Text>
                <FormControl isInvalid={Boolean(error)}>
                  <FormLabel>Paste updated JSON</FormLabel>
                  <Textarea
                    value={inputValue}
                    onChange={onInputChange}
                    fontFamily="mono"
                    fontSize="sm"
                    minH="280px"
                    placeholder="Paste JSON array or JSONL records"
                  />
                  {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
                </FormControl>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={isSaving}>
              Close
            </Button>
            {tabIndex === 1 ? (
              <Button colorScheme="blue" onClick={onSave} isDisabled={!canSave || isSaving} isLoading={isSaving}>
                Apply JSON
              </Button>
            ) : null}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
