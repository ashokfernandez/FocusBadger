import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
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
import EffortSlider from "../EffortSlider.jsx";
import { sanitizeNumber } from "../utils/taskFields.js";
import { WORKSPACE_HEADER_MENU_STYLES } from "./componentTokens.js";

export function AddTaskModal({ isOpen, onClose, onCreate, projects = [], onCreateProject }) {
  const [form, setForm] = useState({
    title: "",
    project: "",
    due: "",
    importance: false,
    urgency: false,
    effort: 3,
    notes: "",
    projectMode: "none",
    newProjectName: ""
  });
  const [error, setError] = useState("");
  const [projectError, setProjectError] = useState("");
  const titleRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      title: "",
      project: "",
      due: "",
      importance: false,
      urgency: false,
      effort: 3,
      notes: "",
      projectMode: "none",
      newProjectName: ""
    });
    setError("");
    setProjectError("");
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

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const title = form.title.trim();
      if (!title) {
        setError("Title is required");
        return;
      }

      let projectValue = undefined;
      if (form.projectMode === "new") {
        const result = onCreateProject?.(form.newProjectName ?? "");
        if (!result || !result.ok) {
          setProjectError(result?.message ?? "Project name is required");
          return;
        }
        projectValue = result.name;
      } else if (form.projectMode === "existing") {
        projectValue = form.project || undefined;
      }

      const payload = {
        title,
        project: projectValue,
        due: form.due.trim() || undefined,
        importance: form.importance ? 5 : undefined,
        urgency: form.urgency ? 5 : undefined,
        effort: sanitizeNumber(form.effort),
        notes: form.notes.trim() || undefined
      };

      const outcome = onCreate(payload);
      if (!outcome?.ok) {
        setError(outcome?.error ?? "Unable to create task");
        return;
      }
      onClose();
    },
    [form, onCreate, onCreateProject, onClose]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={titleRef} size="lg">
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
        <ModalHeader>Add task</ModalHeader>
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
                  value={
                    form.projectMode === "new" ? "__new__" : form.project || ""
                  }
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
              <FormControl display="flex" alignItems="center">
                <Switch
                  id="importance-toggle"
                  isChecked={form.importance}
                  onChange={(event) => handleChange("importance", event.target.checked)}
                  colorScheme="purple"
                  mr={3}
                />
                <FormLabel htmlFor="importance-toggle" mb={0}>
                  Important
                </FormLabel>
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <Switch
                  id="urgency-toggle"
                  isChecked={form.urgency}
                  onChange={(event) => handleChange("urgency", event.target.checked)}
                  colorScheme="orange"
                  mr={3}
                />
                <FormLabel htmlFor="urgency-toggle" mb={0}>
                  Urgent
                </FormLabel>
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <EffortSlider
                value={form.effort}
                defaultValue={3}
                onChange={handleEffortChange}
                isAlwaysVisible
              />
            </FormControl>
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                variant="filled"
                focusBorderColor="blue.400"
                value={form.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
                rows={3}
              />
            </FormControl>
          </Stack>
        </ModalBody>
          <ModalFooter>
            <Stack
              direction={{ base: "column", sm: "row" }}
              spacing={3}
              w="full"
              justify="flex-end"
            >
              <Button variant="ghost" onClick={onClose} width={{ base: "100%", sm: "auto" }}>
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
                width={{ base: "100%", sm: "auto" }}
              >
                Add task
              </Button>
            </Stack>
          </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddTaskModal;
