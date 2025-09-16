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
  Stack,
  Tag,
  Text,
  Textarea,
  useDisclosure
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { parseJSONL, toJSONL } from "./jsonl.js";
import { bucket, score } from "./model.js";

const BUCKETS = ["Today", "This week", "Later", "No date", "Done"];

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

function TaskCard({ item, onEdit, onToggleDone }) {
  const { task, index } = item;
  const [isDragging, setDragging] = useState(false);
  const [isPopping, setPopping] = useState(false);

  const handleDragStart = useCallback(
    (event) => {
      if (!event.dataTransfer) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
      setDragging(true);
    },
    [index]
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
      draggable
      onClick={() => onEdit(index)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      cursor="grab"
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

function BucketColumn({ name, items, onEditTask, onDropTask, onToggleTask }) {
  const [isHover, setHover] = useState(false);

  const handleDragOver = useCallback(
    (event) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
      if (!isHover) setHover(true);
    },
    [isHover]
  );

  const handleDragLeave = useCallback(() => {
    setHover(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setHover(false);
      if (!event.dataTransfer) return;
      onDropTask(name, event.dataTransfer.getData("text/plain"));
    },
    [name, onDropTask]
  );

  return (
    <Box
      borderWidth="1px"
      borderRadius="2xl"
      bg="gray.50"
      minH="320px"
      display="flex"
      flexDirection="column"
      boxShadow={isHover ? "xl" : "md"}
      transition="border-color 0.15s ease, box-shadow 0.15s ease"
      borderColor={isHover ? "blue.400" : "gray.100"}
    >
      <Flex align="center" justify="space-between" px={5} py={4} borderBottomWidth="1px">
        <Heading size="sm">{name}</Heading>
        <Badge colorScheme="gray">{items.length}</Badge>
      </Flex>
      <Stack
        as="ul"
        spacing={3}
        flex="1"
        px={5}
        py={4}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
      >
        {items.map((item) => (
          <TaskCard
            key={item.index}
            item={item}
            onEdit={onEditTask}
            onToggleDone={onToggleTask}
          />
        ))}
      </Stack>
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

  const buckets = useMemo(() => {
    const now = new Date();
    const withIndex = tasks.map((task, index) => ({ task, index }));
    return BUCKETS.map((name) => ({
      name,
      items: withIndex
        .filter(({ task }) => bucket(task, now) === name)
        .sort((a, b) => score(b.task) - score(a.task))
    }));
  }, [tasks]);

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

  const handleDropTask = useCallback(
    (bucketName, rawIndex) => {
      const index = Number.parseInt(rawIndex, 10);
      if (Number.isNaN(index)) return;
      updateTask(index, (draft) => {
        if (bucketName === "Done" && !draft.done) {
          draft.done = true;
          return true;
        }
        if (bucketName !== "Done" && draft.done) {
          draft.done = false;
          return true;
        }
        return false;
      });
    },
    [updateTask]
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
    setTasks(parseJSONL(text));
    fileHandleRef.current = null;
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
    setTasks(parseJSONL(text));
  }, []);

  const handleSaveFile = useCallback(async () => {
    if (!fileHandleRef.current) {
      alert("Open a tasks file first");
      return;
    }
    const writable = await fileHandleRef.current.createWritable();
    await writable.write(toJSONL(tasks));
    await writable.close();
    alert("Saved");
  }, [tasks]);

  const editingTask = editingIndex != null ? tasks[editingIndex] : null;

  return (
    <Container maxW="7xl" py={10}>
      <Stack spacing={8}>
        <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
          <Box>
            <Heading size="lg">TaskBadger</Heading>
            <Text color="gray.500">Drag cards between buckets and edit details inline.</Text>
          </Box>
          <ButtonGroup ml={{ md: "auto" }} spacing={3}>
            <Button variant="ghost" onClick={handleLoadSample}>
              Load sample
            </Button>
            <Button onClick={handleOpenFile}>Open tasks.jsonl</Button>
            <Button colorScheme="blue" onClick={handleSaveFile}>
              Save
            </Button>
          </ButtonGroup>
        </Flex>
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing={6}>
          {buckets.slice(0, 3).map(({ name, items }) => (
            <BucketColumn
              key={name}
              name={name}
              items={items}
              onEditTask={handleOpenEditor}
              onDropTask={handleDropTask}
              onToggleTask={handleToggleDone}
            />
          ))}
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {buckets.slice(3).map(({ name, items }) => (
            <BucketColumn
              key={name}
              name={name}
              items={items}
              onEditTask={handleOpenEditor}
              onDropTask={handleDropTask}
              onToggleTask={handleToggleDone}
            />
          ))}
        </SimpleGrid>
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
