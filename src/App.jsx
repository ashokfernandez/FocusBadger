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
  Spinner,
  Stack,
  Tag,
  Text,
  Textarea,
  useDisclosure
} from "@chakra-ui/react";
import { CheckIcon, CheckCircleIcon, WarningTwoIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { parseJSONL, toJSONL } from "./jsonl.js";
import { bucket, score } from "./model.js";

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

function ProjectSection({ name, items, onEditTask, onToggleTask }) {
  return (
    <Box borderWidth="1px" borderRadius="2xl" bg="white" boxShadow="md" p={5}>
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
            />
          ))}
        </Stack>
      ) : (
        <Text fontSize="sm" color="gray.400">
          No tasks yet.
        </Text>
      )}
    </Box>
  );
}

function TaskEditor({ task, isOpen, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    title: task?.title ?? "",
    project: task?.project ?? "",
    due: task?.due ?? "",
    importance: task?.importance ?? "",
    urgency: task?.urgency ?? "",
    effort: task?.effort ?? "",
    tags: task?.tags ? task.tags.join(", ") : "",
    notes: task?.notes ?? "",
    done: Boolean(task?.done)
  }));
  const [error, setError] = useState("");
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
      done: Boolean(task?.done)
    });
    setError("");
  }, [task]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const title = form.title.trim();
      if (!title) {
        setError("Title is required");
        return;
      }
      const changes = {
        title,
        project: form.project.trim() || undefined,
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
              <FormControl>
                <FormLabel>Project</FormLabel>
                <Input
                  value={form.project}
                  onChange={(event) => handleChange("project", event.target.value)}
                />
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

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const fileHandleRef = useRef(null);
  const disclosure = useDisclosure();
  const lastSavedRef = useRef("");
  const saveTimeoutRef = useRef(null);
  const [saveState, setSaveState] = useState({ status: "idle" });

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

  const projects = useMemo(() => {
    const map = new Map();

    tasks.forEach((task, index) => {
      const key = task.project?.trim() || "No project";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push({ task, index });
    });

    const sortByName = (a, b) => {
      if (a === "No project") return 1;
      if (b === "No project") return -1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    };

    const sortTasks = (items) => {
      return items.slice().sort((a, b) => {
        if (a.task.done !== b.task.done) {
          return a.task.done ? 1 : -1;
        }
        const scoreDiff = score(b.task) - score(a.task);
        if (scoreDiff !== 0) return scoreDiff;
        return a.task.title.localeCompare(b.task.title);
      });
    };

    return Array.from(map.entries())
      .sort(([a], [b]) => sortByName(a, b))
      .map(([name, items]) => ({ name, items: sortTasks(items) }));
  }, [tasks]);

  useEffect(() => {
    const snapshot = toJSONL(tasks);
    const handle = fileHandleRef.current;

    if (!handle) {
      clearPendingSave();
      if (tasks.length) {
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
  }, [tasks, writeToHandle, clearPendingSave]);

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
    fileHandleRef.current = null;
    lastSavedRef.current = toJSONL(parsed);
    setTasks(parsed);
    setSaveState({ status: parsed.length ? "unsynced" : "idle" });
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
    lastSavedRef.current = toJSONL(parsed);
    setTasks(parsed);
    setSaveState({ status: "saved", timestamp: Date.now() });
  }, []);

  const handleSaveFile = useCallback(async () => {
    const handle = await ensureHandleForSave();
    if (!handle) return;
    clearPendingSave();
    const snapshot = toJSONL(tasks);
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
  }, [tasks, ensureHandleForSave, clearPendingSave, writeToHandle]);

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
            {projects.length ? (
              <Stack spacing={5}>
                {projects.map(({ name, items }) => (
                  <ProjectSection
                    key={name}
                    name={name}
                    items={items}
                    onEditTask={handleOpenEditor}
                    onToggleTask={handleToggleDone}
                  />
                ))}
              </Stack>
            ) : (
              <Text fontSize="sm" color="gray.400">
                No tasks loaded yet. Import or add work to get started.
              </Text>
            )}
          </Box>
        </Stack>
      </Stack>
      {editingTask ? (
        <TaskEditor
          task={editingTask}
          isOpen={disclosure.isOpen}
          onCancel={handleCancelEdit}
          onSave={handleSaveEdit}
        />
      ) : null}
    </Container>
  );
}
