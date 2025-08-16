import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface CreateTaskFormProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
}

interface User {
  id: number;
  username: string;
}

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 3,
  p: 4,
};

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ open, onClose, onTaskCreated }) => {
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    user: "", // store username
    priority: "medium",
    status: "todo",
    deadline: "",
  });

  const [users, setUsers] = useState<User[]>([]); // list of users
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:4000/auth/getall", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok) {
          setUsers(data); // assuming data is an array of { id, username }
        } else {
          console.error(data.message || "Failed to fetch users");
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setTaskData({ ...taskData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setSnackbarMessage("Please log in first");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      const res = await fetch("http://localhost:4000/task/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      const data = await res.json();

      if (!res.ok) {
        setSnackbarMessage(data.message || "Something went wrong");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      setSnackbarMessage(data.message || "Task created successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setTaskData({
        title: "",
        description: "",
        user: "",
        priority: "medium",
        status: "todo",
        deadline: "",
      });

      onClose();
      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      console.error(error);
      setSnackbarMessage("Server error");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Box sx={{ ...modalStyle, display: open ? "block" : "none" }} component="div">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Create New Task</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Title"
            name="title"
            value={taskData.title}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Description"
            name="description"
            value={taskData.description}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            multiline
            rows={3}
          />

          {/* Dynamic user select */}
          <TextField
            label="User"
            name="user"
            value={taskData.user}
            onChange={handleChange}
            select
            fullWidth
            required
            margin="normal"
          >
            {users.map((u) => (
              <MenuItem key={u.id} value={u.username}>
                {u.username}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Deadline"
            name="deadline"
            type="date"
            value={taskData.deadline}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Priority"
            name="priority"
            value={taskData.priority}
            onChange={handleChange}
            select
            fullWidth
            margin="normal"
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
          <TextField
            label="Status"
            name="status"
            value={taskData.status}
            onChange={handleChange}
            select
            fullWidth
            margin="normal"
          >
            <MenuItem value="todo">To Do</MenuItem>
            <MenuItem value="progress">In Progress</MenuItem>
            <MenuItem value="done">Done</MenuItem>
          </TextField>

          <Button type="submit" variant="contained" color="success" fullWidth sx={{ mt: 2 }}>
            Save Task
          </Button>
        </form>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateTaskForm;
