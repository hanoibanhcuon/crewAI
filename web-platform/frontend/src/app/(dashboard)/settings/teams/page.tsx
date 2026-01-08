"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { teamsApi } from "@/lib/api";
import {
  Plus,
  Users,
  UserPlus,
  Settings,
  Trash2,
  MoreVertical,
  Mail,
  Crown,
  Shield,
  User,
  Loader2,
  Check,
  X,
  Edit,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface TeamMember {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  role: string;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_deploy: boolean;
  accepted_at?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  slug: string;
  logo_url?: string;
  plan: string;
  plan_expires_at?: string;
  members: TeamMember[];
  created_at: string;
  updated_at: string;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleColors = {
  owner: "text-yellow-500",
  admin: "text-blue-500",
  member: "text-muted-foreground",
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Create team dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });

  // Invite member dialog
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member",
    can_create: true,
    can_edit: true,
    can_delete: false,
    can_deploy: false,
  });

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTeams = async () => {
    try {
      const response = await teamsApi.list();
      const teamList = response.data || [];
      setTeams(teamList);
      if (teamList.length > 0 && !selectedTeam) {
        setSelectedTeam(teamList[0]);
      }
    } catch (err) {
      console.error("Failed to load teams:", err);
      // Demo data
      const demoTeams: Team[] = [
        {
          id: "1",
          name: "My Team",
          description: "Default team for personal projects",
          slug: "my-team",
          plan: "free",
          members: [
            {
              id: "m1",
              user_id: "u1",
              user_email: "me@example.com",
              user_name: "Me",
              role: "owner",
              can_create: true,
              can_edit: true,
              can_delete: true,
              can_deploy: true,
              accepted_at: new Date().toISOString(),
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      setTeams(demoTeams);
      setSelectedTeam(demoTeams[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!createForm.name) return;
    setIsCreating(true);

    try {
      const response = await teamsApi.create(createForm);
      const newTeam = response.data;
      setTeams([...teams, newTeam]);
      setSelectedTeam(newTeam);
      setIsCreateOpen(false);
      setCreateForm({ name: "", description: "" });
    } catch (err) {
      console.error("Failed to create team:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteForm.email) return;
    setIsInviting(true);

    try {
      await teamsApi.invite(selectedTeam.id, inviteForm);
      // Reload team to get updated members
      const response = await teamsApi.get(selectedTeam.id);
      setSelectedTeam(response.data);
      setTeams(teams.map((t) => (t.id === selectedTeam.id ? response.data : t)));
      setIsInviteOpen(false);
      setInviteForm({
        email: "",
        role: "member",
        can_create: true,
        can_edit: true,
        can_delete: false,
        can_deploy: false,
      });
    } catch (err) {
      console.error("Failed to invite member:", err);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (!selectedTeam) return;
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await teamsApi.removeMember(selectedTeam.id, userId);
      const updatedMembers = selectedTeam.members.filter((m) => m.id !== memberId);
      const updatedTeam = { ...selectedTeam, members: updatedMembers };
      setSelectedTeam(updatedTeam);
      setTeams(teams.map((t) => (t.id === selectedTeam.id ? updatedTeam : t)));
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return;
    }

    try {
      await teamsApi.delete(teamId);
      const updatedTeams = teams.filter((t) => t.id !== teamId);
      setTeams(updatedTeams);
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(updatedTeams[0] || null);
      }
    } catch (err) {
      console.error("Failed to delete team:", err);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Team Management">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Team Management"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Link>
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Create a new team to collaborate with others
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Team Name</Label>
                  <Input
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    placeholder="My Awesome Team"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, description: e.target.value })
                    }
                    placeholder="What this team is for..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam} disabled={isCreating || !createForm.name}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Team
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Teams List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Your Teams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTeam?.id === team.id
                      ? "bg-primary/10 border border-primary"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.members.length} member(s)
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {team.plan}
                    </Badge>
                  </div>
                </div>
              ))}

              {teams.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No teams yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTeam ? (
            <>
              {/* Team Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedTeam.name}</CardTitle>
                      <CardDescription>
                        {selectedTeam.description || "No description"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Team Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteTeam(selectedTeam.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Created: {new Date(selectedTeam.created_at).toLocaleDateString()}</span>
                    <span>Plan: {selectedTeam.plan}</span>
                    <span>Slug: {selectedTeam.slug}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Team Members</CardTitle>
                      <CardDescription>
                        {selectedTeam.members.length} member(s) in this team
                      </CardDescription>
                    </div>
                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join {selectedTeam.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                              type="email"
                              value={inviteForm.email}
                              onChange={(e) =>
                                setInviteForm({ ...inviteForm, email: e.target.value })
                              }
                              placeholder="colleague@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                              value={inviteForm.role}
                              onValueChange={(value) =>
                                setInviteForm({ ...inviteForm, role: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3 pt-2 border-t">
                            <Label className="text-sm font-medium">Permissions</Label>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-normal">Can create resources</Label>
                                <Switch
                                  checked={inviteForm.can_create}
                                  onCheckedChange={(checked) =>
                                    setInviteForm({ ...inviteForm, can_create: checked })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-normal">Can edit resources</Label>
                                <Switch
                                  checked={inviteForm.can_edit}
                                  onCheckedChange={(checked) =>
                                    setInviteForm({ ...inviteForm, can_edit: checked })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-normal">Can delete resources</Label>
                                <Switch
                                  checked={inviteForm.can_delete}
                                  onCheckedChange={(checked) =>
                                    setInviteForm({ ...inviteForm, can_delete: checked })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-normal">Can deploy to production</Label>
                                <Switch
                                  checked={inviteForm.can_deploy}
                                  onCheckedChange={(checked) =>
                                    setInviteForm({ ...inviteForm, can_deploy: checked })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleInviteMember}
                            disabled={isInviting || !inviteForm.email}
                          >
                            {isInviting && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            <Mail className="h-4 w-4 mr-2" />
                            Send Invitation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedTeam.members.map((member) => {
                      const RoleIcon = roleIcons[member.role as keyof typeof roleIcons] || User;
                      const roleColor = roleColors[member.role as keyof typeof roleColors] || "";

                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-sm font-medium">
                                {(member.user_name || member.user_email)[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {member.user_name || member.user_email}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${roleColor}`}
                                >
                                  <RoleIcon className="h-3 w-3 mr-1" />
                                  {member.role}
                                </Badge>
                                {!member.accepted_at && (
                                  <Badge variant="secondary" className="text-xs">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {member.user_email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Permissions badges */}
                            <div className="hidden md:flex items-center gap-2">
                              {member.can_create && (
                                <Badge variant="outline" className="text-xs">
                                  Create
                                </Badge>
                              )}
                              {member.can_edit && (
                                <Badge variant="outline" className="text-xs">
                                  Edit
                                </Badge>
                              )}
                              {member.can_delete && (
                                <Badge variant="outline" className="text-xs">
                                  Delete
                                </Badge>
                              )}
                              {member.can_deploy && (
                                <Badge variant="outline" className="text-xs">
                                  Deploy
                                </Badge>
                              )}
                            </div>

                            {member.role !== "owner" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id, member.user_id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {selectedTeam.members.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No members in this team</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setIsInviteOpen(true)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite First Member
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No team selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a team from the list or create a new one
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Team
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
