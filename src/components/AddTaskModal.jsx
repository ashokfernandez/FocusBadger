import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Select,
  Stack,
  Textarea
} from "@chakra-ui/react";
import EffortSlider from "../EffortSlider.jsx";
import { sanitizeNumber, parseTags } from "../utils/taskFields.js";

export function AddTaskModal({ isOpen, onClose, onCreate, projects = [], onCreateProject }) {
  const [form, setForm] = useState({
    title: "",
    project: "",
    due: "",
    importance: "",
    urgency: "",
    effort: 3,
    tags: "",
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
      importance: "",
      urgency: "",
      effort: 3,
      tags: "",
      notes: "",
      projectMode: "none",
      newProjectName: ""
    });
    setError("");
    setProjectError("");
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
        importance: sanitizeNumber(form.importance),
        urgency: sanitizeNumber(form.urgency),
        effort: sanitizeNumber(form.effort),
        tags: parseTags(form.tags),
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
      <ModalContent as="form" onSubmit={handleSubmit}>
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
                    placeholder="New project name"
                    value={form.newProjectName}
                    onChange={(event) => handleNewProjectNameChange(event.target.value)}
                  />
                ) : null}
                {projectError ? <FormErrorMessage>{projectError}</FormErrorMessage> : null}
              </FormControl>
              <FormControl>
                <FormLabel>Due date</FormLabel>
                <Input
                  type="date"
                  value={form.due}
                  onChange={(event) => handleChange("due", event.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Importance</FormLabel>
                <NumberInput
                  min={0}
                  max={5}
                  value={form.importance}
                  onChange={(value) => handleChange("importance", value)}
                >
                  <NumberInputField placeholder="0-5" />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Urgency</FormLabel>
                <NumberInput
                  min={0}
                  max={5}
                  value={form.urgency}
                  onChange={(value) => handleChange("urgency", value)}
                >
                  <NumberInputField placeholder="0-5" />
                </NumberInput>
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel>Effort</FormLabel>
              <EffortSlider
                value={form.effort}
                defaultValue={3}
                onChange={handleEffortChange}
                size="sm"
                isCompact
              />
            </FormControl>
            <FormControl>
              <FormLabel>Tags</FormLabel>
              <Input
                placeholder="comma separated"
                value={form.tags}
                onChange={(event) => handleChange("tags", event.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={form.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
                rows={3}
              />
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Stack direction="row" spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit">
              Add task
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddTaskModal;
