import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Textarea
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import EffortSlider from "../EffortSlider.jsx";
import { sanitizeNumber } from "../utils/taskFields.js";
import { WORKSPACE_HEADER_MENU_STYLES } from "./componentTokens.js";

export default function TaskEditor({
  task,
  isOpen,
  onCancel,
  onSave,
  projects = [],
  onCreateProject
}) {
  const [form, setForm] = useState(() => ({
    title: task?.title ?? "",
    project: task?.project ?? "",
    due: task?.due ?? "",
    importance: (task?.importance ?? 0) >= 3,
    urgency: (task?.urgency ?? 0) >= 3,
    effort: task?.effort ?? undefined,
    notes: task?.notes ?? "",
    done: Boolean(task?.done),
    projectMode: task?.project ? "existing" : "none",
    newProjectName: ""
  }));
  const [error, setError] = useState("");
  const [projectError, setProjectError] = useState("");
  const titleRef = useRef(null);
  const importanceValueRef = useRef(task?.importance ?? undefined);
  const urgencyValueRef = useRef(task?.urgency ?? undefined);

  useEffect(() => {
    importanceValueRef.current = task?.importance ?? undefined;
    urgencyValueRef.current = task?.urgency ?? undefined;
    setForm({
      title: task?.title ?? "",
      project: task?.project ?? "",
      due: task?.due ?? "",
      importance: (task?.importance ?? 0) >= 3,
      urgency: (task?.urgency ?? 0) >= 3,
      effort: task?.effort ?? undefined,
      notes: task?.notes ?? "",
      done: Boolean(task?.done),
      projectMode: task?.project ? "existing" : "none",
      newProjectName: ""
    });
    setError("");
    setProjectError("");
  }, [task]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      if (titleRef.current) {
        titleRef.current.focus();
        titleRef.current.select();
      }
    });
  }, [isOpen]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleProjectSelect = useCallback((value) => {
    if (value === "__new__") {
      setForm((prev) => ({ ...prev, projectMode: "new", project: "", newProjectName: "" }));
    } else if (value) {
      setForm((prev) => ({ ...prev, project: value, projectMode: "existing", newProjectName: "" }));
    } else {
      setForm((prev) => ({ ...prev, project: "", projectMode: "none", newProjectName: "" }));
    }
    setProjectError("");
  }, []);

  const handleNewProjectNameChange = useCallback((value) => {
    setForm((prev) => ({ ...prev, newProjectName: value }));
    setProjectError("");
  }, []);

  const handleEffortChange = useCallback((value) => {
    setForm((prev) => ({ ...prev, effort: value }));
  }, []);

  const handleImportanceToggle = useCallback((isChecked) => {
    setForm((prev) => ({ ...prev, importance: isChecked }));
    if (isChecked) {
      const current = importanceValueRef.current;
      importanceValueRef.current =
        typeof current === "number" && current >= 3 ? current : 5;
    }
  }, []);

  const handleUrgencyToggle = useCallback((isChecked) => {
    setForm((prev) => ({ ...prev, urgency: isChecked }));
    if (isChecked) {
      const current = urgencyValueRef.current;
      urgencyValueRef.current =
        typeof current === "number" && current >= 3 ? current : 5;
    }
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const title = form.title.trim();
      if (!title) {
        setError("Title is required");
        return;
      }
      let projectValue;
      if (form.projectMode === "new") {
        const result = onCreateProject?.(form.newProjectName ?? "");
        if (!result || !result.ok) {
          setProjectError(result?.message ?? "Project name is required");
          return;
        }
        projectValue = result.name;
      } else if (form.projectMode === "existing") {
        projectValue = form.project || undefined;
      } else {
        projectValue = undefined;
      }
      const normalizePriority = (value) =>
        typeof value === "number" && Number.isFinite(value) ? value : 5;
      const changes = {
        title,
        project: projectValue,
        due: form.due.trim() || undefined,
        importance: form.importance
          ? normalizePriority(importanceValueRef.current)
          : undefined,
        urgency: form.urgency ? normalizePriority(urgencyValueRef.current) : undefined,
        effort: sanitizeNumber(form.effort),
        notes: form.notes.trim() || undefined,
        done: form.done
      };
      onSave(changes);
    },
    [form, onCreateProject, onSave, task]
  );

  return (
    <Modal isOpen={isOpen} onClose={onCancel} initialFocusRef={titleRef} size="lg">
      <ModalOverlay />
      <ModalContent
        as="form"
        onSubmit={handleSubmit}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            handleSubmit(event);
          }
        }}
      >
        <ModalHeader>Edit task</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={5}>
            <FormControl isRequired isInvalid={Boolean(error)}>
              <FormLabel>Title</FormLabel>
              <Input
                ref={titleRef}
                value={form.title}
                onChange={(event) => handleChange("title", event.target.value)}
              />
              {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
            </FormControl>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={Boolean(projectError)}>
                <FormLabel>Project</FormLabel>
                <Select
                  variant="filled"
                  focusBorderColor="blue.400"
                  size="md"
                  value={form.projectMode === "new" ? "__new__" : form.project || ""}
                  onChange={(event) => handleProjectSelect(event.target.value)}
                >
                  <option value="">No project</option>
                  {projects.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="__new__">Create new project…</option>
                </Select>
                {form.projectMode === "new" ? (
                  <Input
                    mt={2}
                    variant="filled"
                    focusBorderColor="blue.400"
                    placeholder="New project name"
                    value={form.newProjectName}
                    onChange={(event) => handleNewProjectNameChange(event.target.value)}
                  />
                ) : null}
                {projectError ? <FormErrorMessage>{projectError}</FormErrorMessage> : null}
              </FormControl>
              <FormControl>
                <FormLabel>Due date</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none" color="gray.400" aria-hidden="true">
                    📅
                  </InputLeftElement>
                  <Input
                    pl={10}
                    type="date"
                    variant="filled"
                    focusBorderColor="blue.400"
                    value={form.due}
                    onChange={(event) => handleChange("due", event.target.value)}
                  />
                </InputGroup>
              </FormControl>
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl display="flex" alignItems="center">
                <Switch
                  id="edit-importance-toggle"
                  isChecked={form.importance}
                  onChange={(event) => handleImportanceToggle(event.target.checked)}
                  colorScheme="purple"
                  mr={3}
                />
                <FormLabel htmlFor="edit-importance-toggle" mb={0}>
                  Important
                </FormLabel>
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <Switch
                  id="edit-urgency-toggle"
                  isChecked={form.urgency}
                  onChange={(event) => handleUrgencyToggle(event.target.checked)}
                  colorScheme="orange"
                  mr={3}
                />
                <FormLabel htmlFor="edit-urgency-toggle" mb={0}>
                  Urgent
                </FormLabel>
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <EffortSlider
                value={form.effort ?? 3}
                defaultValue={3}
                onChange={handleEffortChange}
                isAlwaysVisible
              />
            </FormControl>
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                rows={4}
                variant="filled"
                focusBorderColor="blue.400"
                value={form.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
              />
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter
          display="flex"
          flexDirection={{ base: "column", sm: "row" }}
          alignItems={{ base: "stretch", sm: "center" }}
          justifyContent="space-between"
          gap={3}
        >
          <Button
            leftIcon={<CheckIcon />}
            onClick={() => handleChange("done", !form.done)}
            aria-pressed={form.done}
            type="button"
            size="md"
            fontWeight="semibold"
            borderRadius="full"
            px={6}
            colorScheme="purple"
            variant={form.done ? "solid" : "outline"}
            color={form.done ? "white" : "purple.600"}
            bgGradient={form.done ? WORKSPACE_HEADER_MENU_STYLES.gradient : undefined}
            borderColor={form.done ? undefined : "purple.500"}
            boxShadow={form.done ? "lg" : "md"}
            _hover={
              form.done
                ? { bgGradient: WORKSPACE_HEADER_MENU_STYLES.hover, boxShadow: "xl" }
                : { bg: "purple.50" }
            }
            _active={
              form.done
                ? { bgGradient: WORKSPACE_HEADER_MENU_STYLES.active, boxShadow: "xl" }
                : { bg: "purple.100" }
            }
          >
            {form.done ? "Marked as Done" : "Mark as Done"}
          </Button>
          <ButtonGroup spacing={3} ml={{ base: 0, sm: "auto" }}>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              fontWeight="semibold"
              borderRadius="full"
              px={6}
              color="white"
              bgGradient={WORKSPACE_HEADER_MENU_STYLES.gradient}
              boxShadow="md"
              _hover={{ bgGradient: WORKSPACE_HEADER_MENU_STYLES.hover, boxShadow: "lg" }}
              _active={{ bgGradient: WORKSPACE_HEADER_MENU_STYLES.active, boxShadow: "lg" }}
            >
              Save
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
