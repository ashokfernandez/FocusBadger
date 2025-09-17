import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  IconButton,
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
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tag,
  Text,
  Textarea,
  Tooltip,
  Wrap,
  WrapItem,
  useDisclosure
} from "@chakra-ui/react";
import { CheckIcon, CheckCircleIcon, DeleteIcon, WarningTwoIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { parseJSONL } from "./jsonl.js";
import { bucket, score } from "./model.js";
import {
  addProject as addProjectHelper,
  buildSnapshot,
  collectProjects,
  deleteProject as deleteProjectHelper,
  hydrateRecords,
  renameProject as renameProjectHelper,
  compareInsensitive
} from "./projects.js";
import {
  ALL_PROJECTS,
  UNASSIGNED_LABEL,
  shouldIncludeTaskInMatrix
} from "./matrix.js";

function sanitizeNumber(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseTags(value) {
  if (!value) return undefined;
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length ? tags : undefined;
}

const MotionCircle = motion(Box);
const MotionBadge = motion(Badge);
const DEFAULT_MATRIX_FILTERS = [ALL_PROJECTS];

function SaveStatusIndicator({ state }) {
  if (state.status === "saving") {
    return (
      <HStack spacing={2} color="blue.500" fontSize="sm">
        <Spinner size="sm" />
        <Text>Saving…</Text>
      </HStack>
    );
  }

  if (state.status === "saved") {
    return (
      <MotionBadge
        colorScheme="green"
        variant="subtle"
        fontSize="xs"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        display="inline-flex"
        alignItems="center"
        gap={1}
      >
        <CheckCircleIcon /> Saved
      </MotionBadge>
    );
  }

  if (state.status === "dirty") {
    return (
      <Badge colorScheme="orange" variant="subtle" fontSize="xs">
        Unsaved changes
      </Badge>
    );
  }

  if (state.status === "unsynced") {
    return (
      <Badge colorScheme="purple" variant="subtle" fontSize="xs">
        Changes not linked to a file
      </Badge>
    );
  }

  if (state.status === "error") {
    return (
      <HStack spacing={2} color="red.500" fontSize="sm">
        <WarningTwoIcon />
        <Text>Save failed</Text>
      </HStack>
    );
  }

  return (
    <Badge colorScheme="gray" variant="subtle" fontSize="xs">
      Ready
    </Badge>
  );
}

function MatrixFilterChips({ options, active, onToggle }) {
  const renderLabel = useCallback((value) => {
    if (value === ALL_PROJECTS) return "All projects";
    if (value === UNASSIGNED_LABEL) return "Unassigned";
    return value;
  }, []);

  return (
    <Wrap spacing={2} mt={1}>
      {options.map((option) => {
        const selected = active.includes(option);
        return (
          <WrapItem key={option}>
            <Button
              size="xs"
              variant={selected ? "solid" : "outline"}
              colorScheme={selected ? "purple" : "gray"}
              onClick={() => onToggle(option)}
            >
              {renderLabel(option)}
            </Button>
          </WrapItem>
        );
      })}
    </Wrap>
  );
}

function TaskCard({ item, onEdit, onToggleDone, draggable = false }) {
  const { task, index } = item;
  const [isPopping, setPopping] = useState(false);
  const [isDragging, setDragging] = useState(false);

  const handleDragStart = useCallback(
    (event) => {
      if (!draggable || !event.dataTransfer) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
      setDragging(true);
    },
    [draggable, index]
  );

  const handleDragEnd = useCallback(() => {
    setDragging(false);
  }, []);

  const handleToggle = useCallback(
    (event) => {
      event.stopPropagation();
      onToggleDone(index);
      setPopping(true);
    },
    [index, onToggleDone]
  );

  useEffect(() => {
    if (!isPopping) return;
    const timeout = setTimeout(() => setPopping(false), 220);
    return () => clearTimeout(timeout);
  }, [isPopping]);

  return (
    <Box
      as="li"
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => {
        if (isDragging) return;
        onEdit(index);
      }}
      cursor={draggable ? "grab" : "pointer"}
      borderWidth="1px"
      borderRadius="xl"
      p={4}
      bg={task.done ? "gray.100" : "white"}
      boxShadow={isDragging ? "lg" : "sm"}
      transition="all 0.15s ease"
      _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
      display="flex"
      flexDirection="column"
      gap={3}
    >
      <Flex align="center" gap={3}>
        <MotionCircle
          w={8}
          h={8}
          borderRadius="full"
          borderWidth="2px"
          borderColor={task.done ? "green.400" : "gray.300"}
          bg={task.done ? "green.400" : "white"}
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
          role="button"
          aria-pressed={task.done}
          onClick={handleToggle}
          whileTap={{ scale: 0.9 }}
          animate={isPopping ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {task.done ? <CheckIcon w={3} h={3} /> : null}
        </MotionCircle>
        <Box>
          <Heading as="h3" size="sm">
            {task.title}
          </Heading>
          <Text fontSize="sm" color="gray.500">
            {task.notes ? task.notes : "Click to edit details"}
          </Text>
        </Box>
      </Flex>
      <HStack spacing={2} flexWrap="wrap">
        {task.project ? <Tag colorScheme="purple">{task.project}</Tag> : null}
        {task.due ? <Tag colorScheme="orange">Due {task.due}</Tag> : null}
        <Tag colorScheme="blue">Score {score(task)}</Tag>
      </HStack>
    </Box>
  );
}

function MatrixQuadrant({
  title,
  subtitle,
  colorScheme,
  items,
  emptyMessage,
  onEditTask,
  onToggleTask,
  onDropTask,
  quadrantKey
}) {
  const [isHover, setHover] = useState(false);

  const handleDragOver = useCallback(
    (event) => {
      if (!onDropTask) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
      if (!isHover) setHover(true);
    },
    [isHover, onDropTask]
  );

  const handleDragLeave = useCallback(() => {
    setHover(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      if (!onDropTask) return;
      event.preventDefault();
      setHover(false);
      const raw = event.dataTransfer?.getData("text/plain");
      if (!raw) return;
      onDropTask(quadrantKey, raw);
    },
    [onDropTask, quadrantKey]
  );

  return (
    <Box
      borderWidth="1px"
      borderRadius="2xl"
      bg="white"
      p={5}
      boxShadow={isHover ? "xl" : "md"}
      display="flex"
      flexDirection="column"
      gap={4}
      borderColor={isHover ? "blue.400" : "gray.100"}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Flex align="flex-start" justify="space-between" gap={3}>
        <Box>
          <Heading size="sm">{title}</Heading>
          {subtitle ? (
            <Text fontSize="sm" color="gray.500">
              {subtitle}
            </Text>
          ) : null}
        </Box>
        <Badge colorScheme={colorScheme} variant="subtle">
          {items.length}
        </Badge>
      </Flex>
      {items.length ? (
        <Stack as="ul" spacing={3}>
          {items.map((item) => (
            <TaskCard
              key={item.index}
              item={item}
              onEdit={onEditTask}
              onToggleDone={onToggleTask}
              draggable={Boolean(onDropTask)}
            />
          ))}
        </Stack>
      ) : (
        <Flex
          align="center"
          justify="center"
          py={8}
          borderRadius="lg"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="gray.200"
          color="gray.400"
          fontSize="sm"
        >
          {emptyMessage ?? "Nothing here right now."}
        </Flex>
      )}
    </Box>
  );
}

function ProjectSection({
  name,
  projectKey,
  items,
  onEditTask,
  onToggleTask,
  onDropProject
}) {
  const allowDrop = Boolean(onDropProject);
  const [isHover, setHover] = useState(false);

  const handleDragOver = useCallback(
    (event) => {
      if (!allowDrop) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      if (!isHover) setHover(true);
    },
    [allowDrop, isHover]
  );

  const handleDragLeave = useCallback(() => {
    setHover(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      if (!allowDrop) return;
      event.preventDefault();
      setHover(false);
      const raw = event.dataTransfer?.getData("text/plain");
      if (!raw) return;
      onDropProject?.(projectKey ?? undefined, raw);
    },
    [allowDrop, onDropProject, projectKey]
  );

  return (
    <Box
      borderWidth="1px"
      borderRadius="2xl"
      bg="white"
      p={5}
      boxShadow={allowDrop && isHover ? "xl" : "md"}
      borderColor={allowDrop && isHover ? "purple.400" : "gray.100"}
      borderStyle={allowDrop ? "dashed" : "solid"}
      onDragOver={allowDrop ? handleDragOver : undefined}
      onDragLeave={allowDrop ? handleDragLeave : undefined}
      onDrop={allowDrop ? handleDrop : undefined}
      transition="border-color 0.15s ease, box-shadow 0.15s ease"
    >
      <Flex align="center" justify="space-between" mb={4}>
        <Heading size="sm">{name}</Heading>
        <Badge colorScheme="gray">{items.length}</Badge>
      </Flex>
      {items.length ? (
        <Stack as="ul" spacing={3}>
          {items.map((item) => (
            <TaskCard
              key={item.index}
              item={item}
              onEdit={onEditTask}
              onToggleDone={onToggleTask}
              draggable={allowDrop}
            />
          ))}
        </Stack>
      ) : (
        <Text fontSize="sm" color="gray.400">
          {projectKey ? `Drag tasks here to assign to ${name}.` : "Drag tasks here to keep tasks unassigned."}
        </Text>
      )}
    </Box>
  );
}

function TaskEditor({ task, isOpen, onCancel, onSave, projects = [], onCreateProject }) {
  const [form, setForm] = useState(() => ({
    title: task?.title ?? "",
    project: task?.project ?? "",
    due: task?.due ?? "",
    importance: task?.importance ?? "",
    urgency: task?.urgency ?? "",
    effort: task?.effort ?? "",
    tags: task?.tags ? task.tags.join(", ") : "",
    notes: task?.notes ?? "",
    done: Boolean(task?.done),
    projectMode: task?.project ? "existing" : "none",
    newProjectName: ""
  }));
  const [error, setError] = useState("");
  const [projectError, setProjectError] = useState("");
  const titleRef = useRef(null);

  useEffect(() => {
    setForm({
      title: task?.title ?? "",
      project: task?.project ?? "",
      due: task?.due ?? "",
      importance: task?.importance ?? "",
      urgency: task?.urgency ?? "",
      effort: task?.effort ?? "",
      tags: task?.tags ? task.tags.join(", ") : "",
      notes: task?.notes ?? "",
      done: Boolean(task?.done),
      projectMode: task?.project ? "existing" : "none",
      newProjectName: ""
    });
    setError("");
    setProjectError("");
  }, [task]);

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
      const changes = {
        title,
        project: projectValue,
        due: form.due.trim() || undefined,
        importance: sanitizeNumber(form.importance),
        urgency: sanitizeNumber(form.urgency),
        effort: sanitizeNumber(form.effort),
        tags: parseTags(form.tags),
        notes: form.notes.trim() || undefined,
        done: form.done
      };
      onSave(changes);
    },
    [form, onSave]
  );

  return (
    <Modal isOpen={isOpen} onClose={onCancel} initialFocusRef={titleRef} size="lg">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
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
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel>Importance</FormLabel>
                <NumberInput
                  min={0}
                  value={form.importance}
                  onChange={(valueString) => handleChange("importance", valueString)}
                >
                  <NumberInputField inputMode="numeric" />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Urgency</FormLabel>
                <NumberInput
                  min={0}
                  value={form.urgency}
                  onChange={(valueString) => handleChange("urgency", valueString)}
                >
                  <NumberInputField inputMode="numeric" />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Effort</FormLabel>
                <NumberInput
                  min={0}
                  value={form.effort}
                  onChange={(valueString) => handleChange("effort", valueString)}
                >
                  <NumberInputField inputMode="numeric" />
                </NumberInput>
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel>Tags (comma separated)</FormLabel>
              <Input
                value={form.tags}
                onChange={(event) => handleChange("tags", event.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
              />
            </FormControl>
            <Checkbox
              isChecked={form.done}
              onChange={(event) => handleChange("done", event.target.checked)}
            >
              Mark as done
            </Checkbox>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup spacing={3}>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit">
              Save
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function ProjectManagerModal({
  isOpen,
  onClose,
  projects,
  usage,
  onAdd,
  onRename,
  onDelete
}) {
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setNewName("");
      setAddError("");
    }
  }, [isOpen]);

  const handleAdd = useCallback(() => {
    const result = onAdd(newName);
    if (!result.ok) {
      setAddError(result.message ?? "Unable to add project");
      return;
    }
    setNewName("");
    setAddError("");
  }, [newName, onAdd]);

  const handleRename = useCallback(
    (name, nextValue) => onRename(name, nextValue),
    [onRename]
  );

  const handleDelete = useCallback(
    (name) => {
      const count = usage[name] ?? 0;
      const confirmed = window.confirm(
        count
          ? `Delete project "${name}" and unassign ${count} linked task${count === 1 ? "" : "s"}?`
          : `Delete project "${name}"?`
      );
      if (!confirmed) return;
      onDelete(name);
    },
    [onDelete, usage]
  );

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Manage projects</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={6}>
            <FormControl isInvalid={Boolean(addError)}>
              <FormLabel>Add project</FormLabel>
              <HStack align="center" spacing={3}>
                <Input
                  placeholder="Project name"
                  value={newName}
                  onChange={(event) => {
                    setNewName(event.target.value);
                    setAddError("");
                  }}
                  onKeyDown={handleKeyPress}
                />
                <Button colorScheme="blue" onClick={handleAdd}>
                  Add
                </Button>
              </HStack>
              {addError ? <FormErrorMessage>{addError}</FormErrorMessage> : null}
            </FormControl>
            <Stack spacing={4}>
              {projects.length ? (
                projects.map((name) => (
                  <ProjectListItem
                    key={name}
                    name={name}
                    count={usage[name] ?? 0}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <Text fontSize="sm" color="gray.500">
                  No projects yet.
                </Text>
              )}
            </Stack>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function ProjectListItem({ name, count, onRename, onDelete }) {
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(name);
    setError("");
  }, [name]);

  const handleRename = useCallback(() => {
    const result = onRename(name, value);
    if (!result.ok) {
      setError(result.message ?? "Unable to rename project");
      setValue(name);
    } else {
      setValue(result.name ?? value);
      setError("");
    }
  }, [name, onRename, value]);

  return (
    <Stack spacing={1} key={name}>
      <HStack align="flex-start" spacing={3}>
        <Box flex="1">
          <Input
            size="sm"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError("");
            }}
          />
        </Box>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRename}
          isDisabled={value.trim() === name.trim()}
        >
          Rename
        </Button>
        <Tooltip label="Delete project" placement="top">
          <IconButton
            size="sm"
            variant="ghost"
            aria-label={`Delete project ${name}`}
            icon={<DeleteIcon />}
            onClick={() => onDelete(name)}
          />
        </Tooltip>
      </HStack>
      <Text fontSize="xs" color="gray.500">
        {count ? `${count.toLocaleString()} task${count === 1 ? "" : "s"}` : "No tasks yet"}
      </Text>
      {error ? (
        <Text fontSize="xs" color="red.500">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [matrixFilters, setMatrixFilters] = useState(DEFAULT_MATRIX_FILTERS);
  const fileHandleRef = useRef(null);
  const disclosure = useDisclosure();
  const projectManagerDisclosure = useDisclosure();
  const lastSavedRef = useRef("");
  const saveTimeoutRef = useRef(null);
  const [saveState, setSaveState] = useState({ status: "idle" });
  useEffect(() => {
    setProjects((prev) => {
      const derived = collectProjects(
        tasks,
        prev.map((name) => ({ type: "project", name }))
      );
      if (derived.length === prev.length && derived.every((name, idx) => name === prev[idx])) {
        return prev;
      }
      return derived;
    });
  }, [tasks]);

  useEffect(() => {
    setMatrixFilters((prev) => {
      if (prev.includes(ALL_PROJECTS)) return DEFAULT_MATRIX_FILTERS;
      const allowed = new Set(projects.concat([UNASSIGNED_LABEL]));
      const next = prev.filter((value) => value === ALL_PROJECTS || allowed.has(value));
      return next.length ? next : DEFAULT_MATRIX_FILTERS;
    });
  }, [projects]);

  const matrixFilterOptions = useMemo(() => {
    const options = [ALL_PROJECTS, ...projects];
    if (!projects.includes(UNASSIGNED_LABEL)) {
      options.push(UNASSIGNED_LABEL);
    }
    return options;
  }, [projects]);

  const clearPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  const writeToHandle = useCallback(async (handle, text) => {
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  }, []);

  const ensureHandleForSave = useCallback(async () => {
    if (fileHandleRef.current) return fileHandleRef.current;
    if (!window.showSaveFilePicker) {
      alert("Use a Chromium browser for File System Access support");
      return null;
    }
    const handle = await window.showSaveFilePicker({
      suggestedName: "tasks.jsonl",
      types: [{ description: "JSONL", accept: { "text/plain": [".jsonl"] } }]
    });
    fileHandleRef.current = handle;
    return handle;
  }, []);

  const matrix = useMemo(() => {
    const now = new Date();
    const groups = {
      today: [],
      schedule: [],
      delegate: [],
      consider: []
    };

    tasks.forEach((task, index) => {
      if (task.done) return;
      const rawUrgency = task.urgency;
      const urgencyScore = rawUrgency ?? 0;
      const importanceScore = task.importance ?? 0;
      const dueBucket = bucket(task, now);
      const isUrgent =
        urgencyScore >= 3 || (rawUrgency == null && dueBucket === "Today");
      const isImportant = importanceScore >= 3;

      if (!shouldIncludeTaskInMatrix(task, matrixFilters)) return;

      if (isUrgent && isImportant) {
        groups.today.push({ task, index });
      } else if (!isUrgent && isImportant) {
        groups.schedule.push({ task, index });
      } else if (isUrgent && !isImportant) {
        groups.delegate.push({ task, index });
      } else {
        groups.consider.push({ task, index });
      }
    });

    const sortByScore = (a, b) => {
      const scoreDiff = score(b.task) - score(a.task);
      if (scoreDiff !== 0) return scoreDiff;
      return a.task.title.localeCompare(b.task.title);
    };

    Object.keys(groups).forEach((key) => {
      groups[key].sort(sortByScore);
    });

    return groups;
  }, [tasks]);

  const projectGroups = useMemo(() => {
    const map = new Map();
    projects.forEach((name) => {
      map.set(name, []);
    });

    const unassigned = [];

    const sortItems = (items) =>
      items.slice().sort((a, b) => {
        if (a.task.done !== b.task.done) {
          return a.task.done ? 1 : -1;
        }
        const scoreDiff = score(b.task) - score(a.task);
        if (scoreDiff !== 0) return scoreDiff;
        return a.task.title.localeCompare(b.task.title);
      });

    tasks.forEach((task, index) => {
      const entry = { task, index };
      const key = task.project?.trim();
      if (key) {
        if (!map.has(key)) {
          map.set(key, [entry]);
        } else {
          map.get(key).push(entry);
        }
      } else {
        unassigned.push(entry);
      }
    });

    const entries = Array.from(map.entries())
      .map(([name, items]) => ({ name, projectKey: name, items: sortItems(items) }))
      .sort((a, b) => compareInsensitive(a.name, b.name));

    entries.push({
      name: UNASSIGNED_LABEL,
      projectKey: undefined,
      items: sortItems(unassigned)
    });

    return entries;
  }, [tasks, projects]);

  const projectUsage = useMemo(() => {
    const counts = {};
    tasks.forEach((task) => {
      const name = task.project?.trim();
      if (!name) return;
      counts[name] = (counts[name] ?? 0) + 1;
    });
    return counts;
  }, [tasks]);

  useEffect(() => {
    const snapshot = buildSnapshot(tasks, projects);
    const handle = fileHandleRef.current;

    if (!handle) {
      clearPendingSave();
      if (tasks.length || projects.length) {
        setSaveState({ status: "unsynced" });
      } else {
        setSaveState({ status: "idle" });
      }
      return () => {};
    }

    if (snapshot === lastSavedRef.current) {
      clearPendingSave();
      setSaveState({ status: "saved" });
      return () => {};
    }

    clearPendingSave();
    setSaveState({ status: "dirty" });
    const timeout = setTimeout(async () => {
      setSaveState({ status: "saving" });
      try {
        await writeToHandle(handle, snapshot);
        lastSavedRef.current = snapshot;
        setSaveState({ status: "saved", timestamp: Date.now() });
      } catch (error) {
        console.error(error);
        setSaveState({ status: "error", error });
      } finally {
        saveTimeoutRef.current = null;
      }
    }, 600);
    saveTimeoutRef.current = timeout;

    return () => {
      clearTimeout(timeout);
      if (saveTimeoutRef.current === timeout) {
        saveTimeoutRef.current = null;
      }
    };
  }, [tasks, projects, buildSnapshot, writeToHandle, clearPendingSave]);

  const updateTask = useCallback((index, mutator) => {
    setTasks((prev) => {
      const current = prev[index];
      if (!current) return prev;
      const draft = { ...current };
      const outcome = mutator(draft);
      if (!outcome) return prev;
      const nextTask = outcome === true ? draft : { ...draft, ...outcome };
      if (outcome !== true && typeof outcome === "object") {
        for (const [key, value] of Object.entries(outcome)) {
          if (value === undefined) {
            delete nextTask[key];
          }
        }
      }
      nextTask.updated = new Date().toISOString();
      const next = [...prev];
      next[index] = nextTask;
      return next;
    });
  }, []);

  const addProject = useCallback(
    (name) => {
      const result = addProjectHelper(projects, name);
      if (result.ok) {
        setProjects(result.projects);
      }
      return result;
    },
    [projects]
  );

  const renameProject = useCallback(
    (oldName, newName) => {
      const result = renameProjectHelper(projects, tasks, oldName, newName);
      if (result.ok) {
        setProjects(result.projects);
        if (result.tasks !== tasks) {
          setTasks(result.tasks);
        }
      }
      return result;
    },
    [projects, tasks]
  );

  const deleteProject = useCallback(
    (name) => {
      const result = deleteProjectHelper(projects, tasks, name);
      if (result.ok) {
        setProjects(result.projects);
        if (result.tasks !== tasks) {
          setTasks(result.tasks);
        }
      }
      return result;
    },
    [projects, tasks]
  );

  const handleInlineProjectCreate = useCallback(
    (name) => addProject(name),
    [addProject]
  );

  const handleOpenEditor = useCallback(
    (index) => {
      setEditingIndex(index);
      disclosure.onOpen();
    },
    [disclosure]
  );

  const handleToggleDone = useCallback(
    (index) => {
      updateTask(index, (draft) => {
        draft.done = !draft.done;
        return true;
      });
    },
    [updateTask]
  );

  const handleMatrixDrop = useCallback(
    (quadrant, rawIndex) => {
      const index = Number.parseInt(rawIndex, 10);
      if (Number.isNaN(index)) return;
      updateTask(index, (draft) => {
        switch (quadrant) {
          case "today":
            draft.urgency = 4;
            draft.importance = 4;
            break;
          case "schedule":
            draft.importance = 4;
            draft.urgency = 2;
            break;
          case "delegate":
            draft.urgency = 4;
            draft.importance = 1;
            break;
          case "consider":
            draft.urgency = 1;
            draft.importance = 1;
            break;
          default:
            return false;
        }
        return true;
      });
    },
    [updateTask]
  );

  const handleProjectDrop = useCallback(
    (projectName, rawIndex) => {
      const index = Number.parseInt(rawIndex, 10);
      if (Number.isNaN(index)) return;
      updateTask(index, (draft) => {
        const target = projectName ?? undefined;
        const current = draft.project ?? undefined;
        if (current === target) return false;
        return { project: target };
      });
    },
    [updateTask]
  );

  const toggleMatrixFilter = useCallback((filter) => {
    setMatrixFilters((prev) => {
      if (filter === ALL_PROJECTS) {
        return DEFAULT_MATRIX_FILTERS;
      }
      const withoutAll = prev.filter((value) => value !== ALL_PROJECTS);
      const hasFilter = withoutAll.includes(filter);
      const next = hasFilter
        ? withoutAll.filter((value) => value !== filter)
        : [...withoutAll, filter];
      return next.length ? next : DEFAULT_MATRIX_FILTERS;
    });
  }, []);

  const handleSaveEdit = useCallback(
    (changes) => {
      if (editingIndex == null) return;
      updateTask(editingIndex, () => ({ ...changes }));
      disclosure.onClose();
      setEditingIndex(null);
    },
    [editingIndex, updateTask, disclosure]
  );

  const handleCancelEdit = useCallback(() => {
    disclosure.onClose();
    setEditingIndex(null);
  }, [disclosure]);

  const handleLoadSample = useCallback(async () => {
    const res = await fetch("/tasks.sample.jsonl");
    const text = await res.text();
    const parsed = parseJSONL(text);
    const { tasks: taskRecords, projects: projectList } = hydrateRecords(parsed);
    fileHandleRef.current = null;
    lastSavedRef.current = buildSnapshot(taskRecords, projectList);
    setProjects(projectList);
    setTasks(taskRecords);
    setSaveState({ status: taskRecords.length || projectList.length ? "unsynced" : "idle" });
  }, []);

  const handleOpenFile = useCallback(async () => {
    if (!window.showOpenFilePicker) {
      alert("Use a Chromium browser for File System Access support");
      return;
    }
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "JSONL", accept: { "text/plain": [".jsonl"] } }]
    });
    fileHandleRef.current = handle;
    const file = await handle.getFile();
    const text = await file.text();
    const parsed = parseJSONL(text);
    const { tasks: taskRecords, projects: projectList } = hydrateRecords(parsed);
    lastSavedRef.current = buildSnapshot(taskRecords, projectList);
    setProjects(projectList);
    setTasks(taskRecords);
    setSaveState({ status: "saved", timestamp: Date.now() });
  }, []);

  const handleSaveFile = useCallback(async () => {
    const handle = await ensureHandleForSave();
    if (!handle) return;
    clearPendingSave();
    const snapshot = buildSnapshot(tasks, projects);
    setSaveState({ status: "saving" });
    try {
      await writeToHandle(handle, snapshot);
      saveTimeoutRef.current = null;
      lastSavedRef.current = snapshot;
      setSaveState({ status: "saved", timestamp: Date.now() });
    } catch (error) {
      console.error(error);
      setSaveState({ status: "error", error });
    }
  }, [tasks, projects, ensureHandleForSave, clearPendingSave, writeToHandle, buildSnapshot]);

  const editingTask = editingIndex != null ? tasks[editingIndex] : null;

  useEffect(() => () => clearPendingSave(), [clearPendingSave]);

  return (
    <Container maxW="7xl" py={10}>
      <Stack spacing={10}>
        <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
          <Box>
            <Heading size="lg">TaskBadger</Heading>
            <Text color="gray.500">
              Focus on what matters, then see everything in context.
            </Text>
          </Box>
          <Flex ml={{ md: "auto" }} align="center" gap={4}>
            <SaveStatusIndicator state={saveState} />
            <ButtonGroup spacing={3}>
              <Button variant="outline" onClick={projectManagerDisclosure.onOpen}>
                Manage projects
              </Button>
              <Button variant="ghost" onClick={handleLoadSample}>
                Load sample
              </Button>
              <Button onClick={handleOpenFile}>Open tasks.jsonl</Button>
              <Button colorScheme="blue" onClick={handleSaveFile}>
                Save
              </Button>
            </ButtonGroup>
          </Flex>
        </Flex>

        <Stack spacing={6}>
          <Box>
            <Stack spacing={2} mb={4}>
              <Heading size="md">Eisenhower matrix</Heading>
              <Text fontSize="sm" color="gray.500">
                Urgency is influenced by due dates and explicit urgency scores; importance relies on
                the importance score. Everything here stays synced with the project lists below.
              </Text>
              <MatrixFilterChips
                options={matrixFilterOptions}
                active={matrixFilters}
                onToggle={toggleMatrixFilter}
              />
            </Stack>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
              <MatrixQuadrant
                title="Today"
                subtitle="Urgent and important"
                colorScheme="red"
                items={matrix.today}
                onEditTask={handleOpenEditor}
                onToggleTask={handleToggleDone}
                onDropTask={handleMatrixDrop}
                quadrantKey="today"
              />
              <MatrixQuadrant
                title="Schedule"
                subtitle="Important, not urgent"
                colorScheme="purple"
                items={matrix.schedule}
                onEditTask={handleOpenEditor}
                onToggleTask={handleToggleDone}
                emptyMessage="Plan time for these when you can."
                onDropTask={handleMatrixDrop}
                quadrantKey="schedule"
              />
              <MatrixQuadrant
                title="Delegate"
                subtitle="Urgent, not important"
                colorScheme="orange"
                items={matrix.delegate}
                onEditTask={handleOpenEditor}
                onToggleTask={handleToggleDone}
                emptyMessage="Nothing to hand off right now."
                onDropTask={handleMatrixDrop}
                quadrantKey="delegate"
              />
              <MatrixQuadrant
                title="Why are you considering this?"
                subtitle="Not urgent, not important"
                colorScheme="gray"
                items={matrix.consider}
                onEditTask={handleOpenEditor}
                onToggleTask={handleToggleDone}
                emptyMessage="😌 Nothing tempting here — great job."
                onDropTask={handleMatrixDrop}
                quadrantKey="consider"
              />
            </SimpleGrid>
          </Box>

          <Box>
            <Stack spacing={3} mb={4}>
              <Heading size="md">Projects</Heading>
              <Text fontSize="sm" color="gray.500">
                Every task keeps its home project (or none). The matrix highlights the same items without
                removing them from these lists.
              </Text>
            </Stack>
            <Stack spacing={5}>
              {projectGroups.map(({ name, projectKey, items }) => (
                <ProjectSection
                  key={projectKey ?? "__unassigned"}
                  name={name}
                  projectKey={projectKey}
                  items={items}
                  onEditTask={handleOpenEditor}
                  onToggleTask={handleToggleDone}
                  onDropProject={handleProjectDrop}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </Stack>
      <ProjectManagerModal
        isOpen={projectManagerDisclosure.isOpen}
        onClose={projectManagerDisclosure.onClose}
        projects={projects}
        usage={projectUsage}
        onAdd={addProject}
        onRename={renameProject}
        onDelete={deleteProject}
      />
      {editingTask ? (
        <TaskEditor
          task={editingTask}
          isOpen={disclosure.isOpen}
          onCancel={handleCancelEdit}
          onSave={handleSaveEdit}
          projects={projects}
          onCreateProject={handleInlineProjectCreate}
        />
      ) : null}
    </Container>
  );
}
