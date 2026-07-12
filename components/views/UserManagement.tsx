import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  UserPlus,
  Shield,
  User as UserIcon,
  Edit2,
  Trash2,
  Ban,
  CheckCircle,
  X,
  Save,
  Lock,
  Phone,
  Mail,
  AlertCircle,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { User, UserRole } from "../../types";
import { createUser, updateUser, bulkUploadUsers, getUsers, blockUser, unblockUser, deleteUser } from "@/api/users";

function formatDepartment(value: unknown): string {
  if (!value) return "—";
  return String(value)
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatLastLogin(value: unknown): string {
  if (!value) return "Never";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getLastLoginValue(u: Record<string, unknown>): unknown {
  if (u.lastLoginAt) return u.lastLoginAt;
  if (u.lastLogin) return u.lastLogin;
  const metadata = u.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return (metadata as Record<string, unknown>).lastLoginAt;
  }
  return null;
}

function normalizeUser(u: Record<string, unknown>): User {
  const status = u.status as string | undefined;
  return {
    id: String(u.id),
    name: String(u.fullName ?? u.name ?? ""),
    email: String(u.email ?? ""),
    phoneNumber: u.phoneNumber ? String(u.phoneNumber) : undefined,
    role: (u.userRole ?? u.role ?? "LEARNER") as UserRole,
    department: formatDepartment(u.department),
    status: status === "BLOCKED" || status === "Blocked" ? "Blocked" : "Active",
    lastLogin: formatLastLogin(getLastLoginValue(u)),
  };
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<UserRole | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    userId: string | null;
  }>({
    isOpen: false,
    userId: null,
  });

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "LEARNER",
    department: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredUsers = users.filter((user) => {
    const matchesRole = filterRole === "ALL" || user.role === filterRole;
    const matchesSearch =
      (user.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full border border-purple-200 flex items-center gap-1 w-fit">
           Super Admin
          </span>
        );
      case "HR_MANAGER":
        return (
          <span className="px-2 py-1 text-xs font-semibold bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20 w-fit">
            HR Admin
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full border border-gray-200 w-fit">
            Trainee
          </span>
        );
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

const fetchUsers = async () => {
  try {
    setIsLoading(true);
    setError(null);

    const data = await getUsers();
    setUsers(data.map((u) => normalizeUser(u as unknown as Record<string, unknown>)));
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};


  // --- Handlers ---

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      role: "LEARNER",
      department: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      password: "",
      role: user.role,
      department: user.department === "—" ? "" : user.department,
    });
    setIsModalOpen(true);
  };

  const initiateDeleteUser = (userId: string) => {
    setDeleteModal({ isOpen: true, userId });
  };

  const confirmDeleteUser = async () => {
    if (!deleteModal.userId) return;

    try {
      await deleteUser(deleteModal.userId);
      setDeleteModal({ isOpen: false, userId: null });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  };

  const handleToggleBlock = async (user: User) => {
    try {
      if (user.status === "Blocked") {
        await unblockUser(user.id);
      } else {
        await blockUser(user.id);
      }
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user status");
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      (!editingUser && !formData.password)
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      if (editingUser) {
        const payload: Record<string, string> = {
          fullName: formData.name,
          email: formData.email,
          userRole: formData.role,
        };

        if (formData.phoneNumber) {
          payload.phoneNumber = formData.phoneNumber;
        }

        const department = formData.department.trim().toUpperCase();
        if (department && department !== "—") {
          payload.department = department;
        }

        await updateUser(editingUser.id, payload);
      } else {
        const created = await createUser({
          fullName: formData.name,
          email: formData.email,
          password: formData.password,
          userRole: formData.role,
          department: formData.department.trim().toUpperCase(),
          phoneNumber: formData.phoneNumber || undefined,
        });
      }

      setIsModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await bulkUploadUsers(file);
      alert("Users imported successfully");
      setIsImportModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-500">
            Manage access and roles for staff and trainees
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
          >
            <Upload size={18} />
            Import CSV
          </button>
          <button
            onClick={handleOpenCreate}
            className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
          >
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand-primary cursor-pointer"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="HR_MANAGER">HR Admin</option>
            <option value="LEARNER">Trainee</option>
          </select>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
            <Filter size={18} />
          </button>
        </div>
      </div>
      {isLoading && (
        <div className="bg-white p-12 rounded-xl text-center text-gray-500">
          Loading users…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}
      {!isLoading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                        {(user.name || "?").charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">
                          {user.email || user.phoneNumber}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.department}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : user.status === "Blocked"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.status === "Active"
                            ? "bg-green-500"
                            : user.status === "Blocked"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }`}
                      ></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors"
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleBlock(user)}
                        className={`p-1.5 rounded transition-colors ${
                          user.status === "Blocked"
                            ? "text-green-500 hover:text-green-700 hover:bg-green-50"
                            : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                        }`}
                        title={
                          user.status === "Blocked"
                            ? "Unblock User"
                            : "Block User"
                        }
                      >
                        {user.status === "Blocked" ? (
                          <CheckCircle size={16} />
                        ) : (
                          <Ban size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => initiateDeleteUser(user.id)}
                        disabled={user.role === "SUPER_ADMIN"}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                        title={
                          user.role === "SUPER_ADMIN"
                            ? "Super admin accounts cannot be deleted"
                            : "Delete User"
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <UserIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p>No users found matching your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Delete User?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this user? This action cannot be
                undone and will remove their access immediately.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() =>
                    setDeleteModal({ isOpen: false, userId: null })
                  }
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                Bulk Import Users
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-lg p-4 flex gap-3 items-start">
                <div className="bg-brand-primary/10 p-2 rounded text-brand-primary shrink-0">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-brand-primary">
                    CSV Format Required
                  </h4>
                  <p className="text-xs text-brand-primary-dark mt-1">
                    Your CSV must include the following columns in order:
                    <br />
                    <code className="bg-brand-primary/10 px-1 rounded text-brand-primary font-mono">
                      Name, Email, Role, Department
                    </code>
                  </p>
                  <p className="text-xs text-brand-primary mt-2 italic">
                    Example: John Doe, john@example.com, TRAINEE, Sales
                  </p>
                </div>
              </div>

              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Click to upload CSV file
                </p>
                <p className="text-xs text-gray-400 mt-1">Maximum 5MB</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {editingUser ? "Edit User" : "Create New User"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    placeholder="Jane Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="123-456-7890"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    required
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                      placeholder="••••••••"
                      required={!editingUser}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>

                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as UserRole,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                    required
                  >
                    <option value="LEARNER">Trainee</option>
                    <option value="HR_MANAGER">HR Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    placeholder="Operations"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary-dark transition-colors shadow-sm flex items-center gap-2"
                >
                  <Save size={18} />{" "}
                  {editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
