import { Children, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  CloseButton,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
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
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  Textarea,
  Tooltip,
  Wrap,
  WrapItem,
  useClipboard,
  useDisclosure
} from "@chakra-ui/react";
import { CheckIcon, CheckCircleIcon, ChevronDownIcon, CopyIcon, DeleteIcon, EditIcon, WarningTwoIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { bucket, score } from "./model.js";
import {
  addProject as addProjectHelper,
  buildSnapshot,
  collectProjects,
  deleteProject as deleteProjectHelper,
  hydrateRecords,
  renameProject as renameProjectHelper
} from "./projects.js";
import {
  ALL_PROJECTS,
  UNASSIGNED_LABEL,
  MATRIX_SORTS,
  shouldIncludeTaskInMatrix,
  sortMatrixEntries
} from "./matrix.js";
import EffortSlider from "./EffortSlider.jsx";
import { HEADER_LAYOUT, MATRIX_GRID_COLUMNS } from "./layout.js";
import { TOOLBAR_SORTS, projectSectionsFrom } from "./toolbar.js";
import { buildJSONExport, parseJSONInput } from "./jsonEditor.js";
import { createTaskPayload } from "./taskFactory.js";

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

function AddTaskModal({ isOpen, onClose, onCreate, projects = [], onCreateProject }) {
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
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit">
              Add task
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function SaveStatusIndicator({ state, onSave }) {
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
      <HStack spacing={3} align="center">
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
        {onSave ? (
          <Button size="xs" variant="outline" onClick={onSave}>
            Save anyway
          </Button>
        ) : null}
      </HStack>
    );
  }

  if (state.status === "dirty") {
    return (
      <HStack spacing={3} align="center">
        <Badge colorScheme="orange" variant="subtle" fontSize="xs">
          Unsaved changes
        </Badge>
        {onSave ? (
          <Button size="xs" colorScheme="orange" onClick={onSave}>
            Save now
          </Button>
        ) : null}
      </HStack>
    );
  }

  if (state.status === "unsynced") {
    return (
      <HStack spacing={3} align="center">
        <Badge colorScheme="purple" variant="subtle" fontSize="xs">
          Unsynced changes
        </Badge>
        {onSave ? (
          <Button size="xs" variant="outline" onClick={onSave}>
            Save
          </Button>
        ) : null}
      </HStack>
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
    <HStack spacing={3} align="center">
      <Badge colorScheme="gray" variant="subtle" fontSize="xs">
        Ready
      </Badge>
      {onSave ? (
        <Button size="xs" variant="outline" onClick={onSave}>
          Save now
        </Button>
      ) : null}
    </HStack>
  );
}

function MatrixFilterChips({ options, active, onToggle, children }) {
  const renderLabel = useCallback((value) => {
    if (value === ALL_PROJECTS) return "All projects";
    if (value === UNASSIGNED_LABEL) return "Unassigned";
    return value;
  }, []);

  const extraItems = useMemo(() => Children.toArray(children), [children]);

  return (
    <Wrap spacing={{ base: 2, md: 3 }} mt={1}>
      {options.map((option) => {
        const selected = active.includes(option);
        return (
          <WrapItem key={option}>
            <Button
              size="xs"
              variant={selected ? "solid" : "outline"}
              colorScheme={selected ? "purple" : "gray"}
              onClick={() => onToggle(option)}
              aria-pressed={selected}
            >
              {renderLabel(option)}
            </Button>
          </WrapItem>
        );
      })}
      {extraItems.map((child, index) => (
        <WrapItem key={`extra-${index}`}>{child}</WrapItem>
      ))}
    </Wrap>
  );
}

function MatrixSortControl({ value, onChange }) {
  const options = useMemo(
    () => [
      { value: MATRIX_SORTS.SCORE, label: "Top priority" },
      { value: MATRIX_SORTS.LOW_EFFORT, label: "Low effort first" }
    ],
    []
  );

  return (
    <HStack spacing={2} align="center">
      <Text fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="gray.500">
        Sort
      </Text>
      <ButtonGroup size="xs" isAttached variant="outline">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <Button
              key={option.value}
              variant={isActive ? "solid" : "outline"}
              colorScheme={isActive ? "purple" : "gray"}
              onClick={() => {
                if (isActive) return;
                onChange(option.value);
              }}
              aria-pressed={isActive}
            >
              {option.label}
            </Button>
          );
        })}
      </ButtonGroup>
    </HStack>
  );
}

function GlobalToolbar({
  filterOptions,
  activeFilters,
  onToggleFilter,
  sortMode,
  onSortModeChange
}) {
  const sortOptions = useMemo(
    () => [
      { value: TOOLBAR_SORTS.SCORE, label: "Score (highest first)" },
      { value: TOOLBAR_SORTS.DUE_DATE, label: "Due date (earliest)" },
      { value: TOOLBAR_SORTS.TITLE, label: "Title (A–Z)" }
    ],
    []
  );

  const activeSortLabel = useMemo(() => {
    const match = sortOptions.find((option) => option.value === sortMode);
    return match ? match.label : sortOptions[0].label;
  }, [sortOptions, sortMode]);

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.100"
      boxShadow="md"
      px={{ base: 4, md: 6 }}
      py={{ base: 4, md: 5 }}
      data-testid="workspace-toolbar"
    >
      <Stack spacing={{ base: 3, md: 4 }}>
        <MatrixFilterChips options={filterOptions} active={activeFilters} onToggle={onToggleFilter}>
          <Menu>
            <MenuButton
              as={Button}
              size="xs"
              variant="outline"
              colorScheme="purple"
              rightIcon={<ChevronDownIcon />}
              data-testid="project-sort-select"
            >
              Sort: {activeSortLabel}
            </MenuButton>
            <MenuList>
              {sortOptions.map((option) => {
                const isActive = option.value === sortMode;
                return (
                  <MenuItem
                    key={option.value}
                    onClick={() => {
                      if (isActive) return;
                      onSortModeChange?.(option.value);
                    }}
                    fontWeight={isActive ? "semibold" : "normal"}
                  >
                    {option.label}
                  </MenuItem>
                );
              })}
            </MenuList>
          </Menu>
        </MatrixFilterChips>
      </Stack>
    </Box>
  );
}

function TaskCard({ item, onEdit, onToggleDone, onEffortChange, draggable = false }) {
  const { task, index } = item;
  const [isPopping, setPopping] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const handleEffortUpdate = useCallback(
    (value) => {
      onEffortChange?.(index, value);
    },
    [index, onEffortChange]
  );

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
      <Box
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <EffortSlider value={task.effort} onChange={handleEffortUpdate} size="sm" isCompact />
      </Box>
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
  quadrantKey,
  onEffortChange
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
              onEffortChange={onEffortChange}
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
  onDropProject,
  onEffortChange
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
              onEffortChange={onEffortChange}
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
    effort: task?.effort ?? undefined,
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
      effort: task?.effort ?? undefined,
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
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
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
            </SimpleGrid>
            <EffortSlider value={form.effort} onChange={handleEffortChange} />
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
  const [matrixSortMode, setMatrixSortMode] = useState(MATRIX_SORTS.SCORE);
  const [projectSortMode, setProjectSortMode] = useState(TOOLBAR_SORTS.SCORE);
  const fileHandleRef = useRef(null);
  const disclosure = useDisclosure();
  const projectManagerDisclosure = useDisclosure();
  const addTaskDisclosure = useDisclosure();
  const jsonModal = useDisclosure();
  const lastSavedRef = useRef("");
  const saveTimeoutRef = useRef(null);
  const [saveState, setSaveState] = useState({ status: "idle" });
  const [jsonTabIndex, setJsonTabIndex] = useState(0);
  const [jsonInputValue, setJsonInputValue] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [jsonParsed, setJsonParsed] = useState(null);
  const [isJsonSaving, setIsJsonSaving] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(false);
  const hasUnassignedTasks = useMemo(
    () => tasks.some((task) => !(task.project?.trim())),
    [tasks]
  );
  const jsonExportText = useMemo(() => buildJSONExport(tasks, projects), [tasks, projects]);
  const clipboard = useClipboard(jsonExportText);
  const canSaveJson = jsonTabIndex === 1 && jsonParsed?.ok && !jsonError;
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
    if (!jsonModal.isOpen) return;
    setJsonInputValue(jsonExportText);
    const initial = parseJSONInput(jsonExportText);
    if (initial.ok) {
      setJsonParsed(initial);
      setJsonError("");
    } else {
      setJsonParsed(null);
      setJsonError(initial.error ?? "");
    }
  }, [jsonModal.isOpen, jsonExportText]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.showOpenFilePicker) {
      setShowDemoBanner(true);
    }
  }, []);

  useEffect(() => {
    setMatrixFilters((prev) => {
      if (prev.includes(ALL_PROJECTS)) return DEFAULT_MATRIX_FILTERS;
      const allowed = new Set(projects);
      if (hasUnassignedTasks) {
        allowed.add(UNASSIGNED_LABEL);
      }
      const next = prev.filter((value) => value === ALL_PROJECTS || allowed.has(value));
      return next.length ? next : DEFAULT_MATRIX_FILTERS;
    });
  }, [projects, hasUnassignedTasks]);

  const matrixFilterOptions = useMemo(() => {
    const options = [ALL_PROJECTS, ...projects];
    if (hasUnassignedTasks) {
      options.push(UNASSIGNED_LABEL);
    }
    return options;
  }, [projects, hasUnassignedTasks]);

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

    return {
      today: sortMatrixEntries(groups.today, matrixSortMode),
      schedule: sortMatrixEntries(groups.schedule, matrixSortMode),
      delegate: sortMatrixEntries(groups.delegate, matrixSortMode),
      consider: sortMatrixEntries(groups.consider, matrixSortMode)
    };
  }, [tasks, matrixFilters, matrixSortMode]);

  const projectGroups = useMemo(
    () => projectSectionsFrom(tasks, projects, projectSortMode, matrixFilters),
    [tasks, projects, projectSortMode, matrixFilters]
  );

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

  const handleEffortCommit = useCallback(
    (index, value) => {
      const clamped = Math.max(1, Math.min(10, Math.round(value)));
      updateTask(index, (draft) => {
        if (draft.effort === clamped) return false;
        return { effort: clamped };
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

  const handleMatrixSortChange = useCallback((mode) => {
    setMatrixSortMode((prev) => (prev === mode ? prev : mode));
  }, []);

  const handleProjectSortModeChange = useCallback((value) => {
    setProjectSortMode((prev) => (prev === value ? prev : value));
  }, []);

  const handleCreateTask = useCallback(
    (draft) => {
      const result = createTaskPayload(draft);
      if (!result.ok) {
        return result;
      }
      setTasks((prev) => [...prev, result.task]);
      return { ok: true };
    },
    []
  );

  const openJsonExport = useCallback(() => {
    setJsonTabIndex(0);
    jsonModal.onOpen();
  }, [jsonModal]);

  const openJsonImport = useCallback(() => {
    setJsonTabIndex(1);
    jsonModal.onOpen();
  }, [jsonModal]);

  const handleJsonTabChange = useCallback(
    (index) => {
      setJsonTabIndex(index);
      if (index !== 1) {
        setJsonError("");
        return;
      }
      const result = parseJSONInput(jsonInputValue);
      if (result.ok) {
        setJsonParsed(result);
        setJsonError("");
      } else {
        setJsonParsed(null);
        setJsonError(result.error ?? "");
      }
    },
    [jsonInputValue]
  );

  const handleJsonInputChange = useCallback((event) => {
    const { value } = event.target;
    setJsonInputValue(value);
    const result = parseJSONInput(value);
    if (result.ok) {
      setJsonParsed(result);
      setJsonError("");
    } else {
      setJsonParsed(null);
      setJsonError(result.error ?? "");
    }
  }, []);

  const handleJsonSave = useCallback(async () => {
    if (!jsonParsed?.ok) return;
    setIsJsonSaving(true);
    const nextTasks = jsonParsed.tasks;
    const nextProjects = jsonParsed.projects;
    const snapshot = buildSnapshot(nextTasks, nextProjects);
    try {
      setTasks(nextTasks);
      setProjects(nextProjects);
      clearPendingSave();
      const handle = await ensureHandleForSave();
      if (handle) {
        setSaveState({ status: "saving" });
        await writeToHandle(handle, snapshot);
        lastSavedRef.current = snapshot;
        setSaveState({ status: "saved", timestamp: Date.now() });
      } else {
        lastSavedRef.current = snapshot;
        setSaveState({ status: nextTasks.length || nextProjects.length ? "unsynced" : "idle" });
      }
      jsonModal.onClose();
    } catch (error) {
      console.error(error);
      setSaveState({ status: "error", error });
    } finally {
      setIsJsonSaving(false);
    }
  }, [jsonParsed, buildSnapshot, clearPendingSave, ensureHandleForSave, jsonModal, writeToHandle]);

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
    const sources = ["/tasks.json", "/tasks.sample.jsonl"];
    for (const path of sources) {
      try {
        const res = await fetch(path);
        if (!res.ok) continue;
        const text = await res.text();
        const parsed = parseJSONInput(text);
        if (!parsed.ok) continue;
        const { tasks: taskRecords, projects: projectList } = parsed;
        fileHandleRef.current = null;
        const snapshot = buildSnapshot(taskRecords, projectList);
        lastSavedRef.current = snapshot;
        setProjects(projectList);
        setTasks(taskRecords);
        setSaveState({ status: taskRecords.length || projectList.length ? "unsynced" : "idle" });
        setShowDemoBanner(false);
        return;
      } catch (error) {
        console.error(error);
      }
    }
    alert("Unable to load sample tasks.json");
  }, [buildSnapshot]);

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
    const parsed = parseJSONInput(text);
    if (!parsed.ok) {
      alert(parsed.error ?? "Unable to parse JSON");
      return;
    }
    const { tasks: taskRecords, projects: projectList } = parsed;
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
        {showDemoBanner ? (
          <Alert status="info" variant="left-accent" borderRadius="xl" alignItems="center">
            <AlertIcon />
            <Box flex="1">
              <Text fontWeight="medium">Exploring TaskBadger online?</Text>
              <Text fontSize="sm" color="gray.700">
                Load demo data to try the workspace without linking a local file. You can dismiss this banner after loading.
              </Text>
            </Box>
            <Button size="sm" colorScheme="purple" onClick={handleLoadSample} mr={2}>
              Load demo data
            </Button>
            <CloseButton position="static" onClick={() => setShowDemoBanner(false)} />
          </Alert>
        ) : null}
        <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
          <Box>
            <Heading size="lg">TaskBadger</Heading>
            <Text color="gray.500">
              Focus on what matters
            </Text>
          </Box>
        <Flex {...HEADER_LAYOUT.container}>
          <SaveStatusIndicator state={saveState} onSave={handleSaveFile} />
          <Wrap spacing={2} justify="flex-end">
            <WrapItem>
              <Button colorScheme="purple" onClick={addTaskDisclosure.onOpen} {...HEADER_LAYOUT.button}>
                Add task
              </Button>
            </WrapItem>
            <WrapItem>
              <Button variant="outline" onClick={handleOpenFile} {...HEADER_LAYOUT.button}>
                Open file
              </Button>
            </WrapItem>
            <WrapItem>
              <Button variant="outline" onClick={openJsonExport} {...HEADER_LAYOUT.button}>
                Copy JSON
              </Button>
            </WrapItem>
            <WrapItem>
              <Button variant="outline" onClick={openJsonImport} {...HEADER_LAYOUT.button}>
                Apply JSON
              </Button>
            </WrapItem>
          </Wrap>
        </Flex>
        </Flex>

        <GlobalToolbar
          filterOptions={matrixFilterOptions}
          activeFilters={matrixFilters}
          onToggleFilter={toggleMatrixFilter}
          sortMode={projectSortMode}
          onSortModeChange={handleProjectSortModeChange}
        />

        <Stack spacing={6}>
          <Box>
            <Flex
              direction={{ base: "column", md: "row" }}
              align={{ base: "flex-start", md: "center" }}
              justify="space-between"
              gap={{ base: 3, md: 4 }}
              mb={4}
            >
              <Box>
                <Heading size="md">Priority matrix</Heading>
                <Text fontSize="sm" color="gray.500">
                  Use the workspace filters above to zero in on the projects that matter most, then sort to
                  decide what to tackle right now.
                </Text>
              </Box>
              <Box mt={{ base: 1, md: 0 }}>
                <MatrixSortControl value={matrixSortMode} onChange={handleMatrixSortChange} />
              </Box>
            </Flex>
            <SimpleGrid columns={MATRIX_GRID_COLUMNS} spacing={6}>
              <MatrixQuadrant
                title="Why aren't you doing this now?"
                subtitle="Urgent and important"
                colorScheme="red"
                items={matrix.today}
                onEditTask={handleOpenEditor}
                onToggleTask={handleToggleDone}
                onDropTask={handleMatrixDrop}
                quadrantKey="today"
                onEffortChange={handleEffortCommit}
              />
              <MatrixQuadrant
                title="When can you do this later?"
                subtitle="Important, not urgent"
                colorScheme="purple"
                items={matrix.schedule}
                onEditTask={handleOpenEditor}
                onToggleTask={handleToggleDone}
                emptyMessage="Plan time for these when you can."
                onDropTask={handleMatrixDrop}
                quadrantKey="schedule"
                onEffortChange={handleEffortCommit}
              />
              <MatrixQuadrant
                title="Who can help you with this?"
                subtitle="Urgent, not important"
                colorScheme="orange"
                items={matrix.delegate}
                onEditTask={handleOpenEditor}
                onToggleTask={handleToggleDone}
                emptyMessage="Nothing to hand off right now."
                onDropTask={handleMatrixDrop}
                quadrantKey="delegate"
                onEffortChange={handleEffortCommit}
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
                onEffortChange={handleEffortCommit}
              />
            </SimpleGrid>
          </Box>

          <Box>
            <Stack spacing={3} mb={4}>
              <Flex align="center" justify="space-between">
                <Box>
                  <Heading size="md">Projects</Heading>
                  <Text fontSize="sm" color="gray.500">
                    Organise tasks by project. Filters and sorting follow the workspace toolbar above so every
                    section stays in sync.
                  </Text>
                </Box>
                <Tooltip label="Manage projects" placement="top">
                  <IconButton
                    aria-label="Manage projects"
                    icon={<EditIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={projectManagerDisclosure.onOpen}
                  />
                </Tooltip>
              </Flex>
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
                  onEffortChange={handleEffortCommit}
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
      <AddTaskModal
        isOpen={addTaskDisclosure.isOpen}
        onClose={addTaskDisclosure.onClose}
        onCreate={handleCreateTask}
        projects={projects}
        onCreateProject={handleInlineProjectCreate}
      />
      <Modal
        isOpen={jsonModal.isOpen}
        onClose={jsonModal.onClose}
        size="4xl"
        closeOnOverlayClick={!isJsonSaving}
        closeOnEsc={!isJsonSaving}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assistant workflow</ModalHeader>
          <ModalCloseButton isDisabled={isJsonSaving} />
          <ModalBody>
            <Tabs index={jsonTabIndex} onChange={handleJsonTabChange} isLazy isFitted variant="enclosed">
              <TabList>
                <Tab>Copy for assistant</Tab>
                <Tab>Apply assistant output</Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={0} pt={4} pb={2}>
                  <Stack spacing={4} align="flex-start">
                    <Text fontSize="sm" color="gray.600">
                      Share this payload with your LLM assistant. It includes projects first followed by tasks.
                    </Text>
                    <Button
                      size="sm"
                      variant={clipboard.hasCopied ? "solid" : "outline"}
                      colorScheme={clipboard.hasCopied ? "green" : "purple"}
                      leftIcon={<CopyIcon />}
                      onClick={clipboard.onCopy}
                    >
                      {clipboard.hasCopied ? "Copied" : "Copy JSON"}
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
                    >
                      {jsonExportText}
                    </Box>
                  </Stack>
                </TabPanel>
                <TabPanel px={0} pt={4} pb={2}>
                  <Stack spacing={4}>
                    <Text fontSize="sm" color="gray.600">
                      Paste the assistant output below. JSON arrays and JSONL are both accepted. We validate every task before applying.
                    </Text>
                    <FormControl isInvalid={Boolean(jsonError)}>
                      <FormLabel>Paste updated JSON</FormLabel>
                      <Textarea
                        value={jsonInputValue}
                        onChange={handleJsonInputChange}
                        fontFamily="mono"
                        fontSize="sm"
                        minH="280px"
                        placeholder="Paste JSON array or JSONL records"
                      />
                      {jsonError ? <FormErrorMessage>{jsonError}</FormErrorMessage> : null}
                    </FormControl>
                  </Stack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={jsonModal.onClose} isDisabled={isJsonSaving}>
                Close
              </Button>
              {jsonTabIndex === 1 ? (
                <Button
                  colorScheme="blue"
                  onClick={handleJsonSave}
                  isDisabled={!canSaveJson || isJsonSaving}
                  isLoading={isJsonSaving}
                >
                  Apply JSON
                </Button>
              ) : null}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
