import { KeyRound, Mail, Phone, UserPlus, UserRound } from "lucide-react";
import DataTable from "../../../components/common/DataTable";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { assignableRoleOptions } from "../../../constants/permissions";
import { getErrorMessage, passwordRules, phoneRules, selectRules, textRules, emailRules } from "../../../utils/validation";

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatusTone = (isOnline) =>
  isOnline
    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
    : "border-slate-500/20 bg-slate-500/10 text-slate-300";

export default function UsersPage({
  users = [],
  canCreateUsers,
  userError,
  userSuccess,
  errors,
  register,
  handleSubmit,
  handleCreateUser,
  isSubmitting,
  selectedUserRole,
  managerOptions,
}) {
  const columns = [
    {
      key: "name",
      label: "Staff Member",
      searchValue: (row) => `${row.name || ""} ${row.email || ""} ${row.phone || ""}`,
      render: (row) => (
        <div>
          <p className="font-medium text-ivory">{row.name || "-"}</p>
          <p className="mt-1 text-sm text-muted">{row.email || "-"}</p>
          <p className="mt-1 text-sm text-muted">{row.phone || "-"}</p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold-2">
          {row.role || "-"}
        </span>
      ),
    },
    {
      key: "isOnline",
      label: "Status",
      searchValue: (row) => (row.isOnline ? "online" : "offline"),
      render: (row) => (
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
            row.isOnline
              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
              : "border-slate-500/20 bg-slate-500/10 text-slate-300"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${row.isOnline ? "bg-emerald-400" : "bg-slate-400"}`} />
          {row.isOnline ? "Online" : "Offline"}
        </span>
      ),
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      render: (row) => formatDateTime(row.lastLoginAt),
    },
    {
      key: "lastSeenAt",
      label: "Last Seen",
      render: (row) => formatDateTime(row.lastSeenAt),
    },
    {
      key: "managerName",
      label: "Manager",
      render: (row) => (row.managerName ? `Reports to ${row.managerName}` : "-"),
    },
  ];

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glass">
      <div className="flex items-center gap-3">
        <UserPlus className="h-5 w-5 text-gold-2" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Team Access</p>
          <h3 className="mt-2 font-display text-2xl">Create and review staff</h3>
        </div>
      </div>

      {canCreateUsers ? (
        <form className="mt-5 space-y-4" onSubmit={handleSubmit(handleCreateUser)}>
          <FormInput
            label="Full Name"
            icon={UserRound}
            error={getErrorMessage(errors.name)}
            {...register("name", textRules("Name", { min: 3, max: 60 }))}
          />
          <FormInput
            label="Email"
            type="email"
            icon={Mail}
            error={getErrorMessage(errors.email)}
            {...register("email", emailRules())}
          />
          <FormInput
            label="Phone"
            type="tel"
            icon={Phone}
            error={getErrorMessage(errors.phone)}
            {...register("phone", phoneRules())}
          />
          <FormInput
            label="Password"
            type="password"
            icon={KeyRound}
            error={getErrorMessage(errors.password)}
            {...register("password", passwordRules())}
          />
          <SelectDropdown
            label="Role"
            options={assignableRoleOptions}
            error={getErrorMessage(errors.role)}
            {...register("role", selectRules("Role"))}
          />
          {selectedUserRole === "sales" ? (
            <SelectDropdown
              label="Reporting Manager"
              options={managerOptions}
              placeholder="Select manager"
              error={getErrorMessage(errors.managerId)}
              {...register("managerId")}
            />
          ) : null}

          {userError ? <p className="text-sm text-rose-300">{userError}</p> : null}
          {userSuccess ? <p className="text-sm text-emerald-300">{userSuccess}</p> : null}

          <div className="flex justify-end">
            <Button disabled={isSubmitting} icon={UserPlus}>
              {isSubmitting ? "Creating..." : "Create Staff"}
            </Button>
          </div>
        </form>
      ) : (
          <p className="mt-5 text-sm text-muted">You can review staff here, but only Super Admin can create new accounts.</p>
      )}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={users}
          totalRecords={users.length}
          emptyMessage="No staff found."
          searchPlaceholder="Search staff..."
          defaultRowsPerPage={10}
        />
      </div>
    </div>
  );
}
