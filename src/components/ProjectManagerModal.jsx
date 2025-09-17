import { useCallback, useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
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
  Stack,
  Text,
  Tooltip
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { WORKSPACE_HEADER_MENU_STYLES } from "./componentTokens.js";
import { colors } from "../theme/tokens.js";

export function ProjectListItem({ name, count, onRename, onDelete }) {
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
        <Input
          size="sm"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
        />
        <Button
          size="sm"
          fontWeight="semibold"
          borderRadius="full"
          px={4}
          variant="outline"
          colorScheme="purple"
          borderColor={colors.borderPriority}
          onClick={handleRename}
          isDisabled={value.trim() === name.trim()}
          _hover={{ bg: colors.surfacePriority }}
          _active={{ bg: colors.surfaceDropzone }}
        >
          Rename
        </Button>
        <Tooltip label="Delete project" placement="top">
          <IconButton
            size="sm"
            variant="ghost"
            colorScheme="red"
            aria-label={`Delete project ${name}`}
            icon={<DeleteIcon />}
            onClick={() => onDelete(name)}
          />
        </Tooltip>
      </HStack>
      <Text fontSize="xs" color={colors.textSubtle}>
        {count ? `${count.toLocaleString()} task${count === 1 ? "" : "s"}` : "No tasks yet"}
      </Text>
      {error ? (
        <Text fontSize="xs" color={colors.textError}>
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}

export default function ProjectManagerModal({
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
                <Button
                  onClick={handleAdd}
                  fontWeight="semibold"
                  borderRadius="full"
                  px={5}
                  color="white"
                  bgGradient={WORKSPACE_HEADER_MENU_STYLES.gradient}
                  boxShadow="md"
                  _hover={{ bgGradient: WORKSPACE_HEADER_MENU_STYLES.hover, boxShadow: "lg" }}
                  _active={{ bgGradient: WORKSPACE_HEADER_MENU_STYLES.active, boxShadow: "lg" }}
                >
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
                <Text fontSize="sm" color={colors.textMuted}>
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
