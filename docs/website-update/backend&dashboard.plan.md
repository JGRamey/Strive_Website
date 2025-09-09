# Strive Tech Dashboard & Backend Implementation Plan

## Project Overview
Transform the existing Strive Tech website into a comprehensive platform with multi-tier user dashboards, CRM/CMS capabilities, and full backend infrastructure using Supabase and Vercel.

## Phase 0: Pre-Implementation Setup (Day 1)

### 0.1 Environment Preparation
- [ ] Create Supabase project and obtain API keys
- [ ] Set up Vercel account and link GitHub repository
- [ ] Create `.env.local` with required variables:
  ```env
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_KEY=your_service_key
  MASTER_ADMIN_EMAIL=admin@strivetech.com
  MASTER_ADMIN_PASSWORD=secure_password_here
  ```

### 0.2 Dependency Installation
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-react
npm install @tanstack/react-table recharts
npm install react-hook-form @hookform/resolvers
npm install date-fns react-day-picker
npm install @tiptap/react @tiptap/starter-kit # for rich text editing
```

### 0.3 Project Structure Review
- [ ] Analyze existing components in `/client/src/components/ui/`
- [ ] Document current color scheme and design tokens
- [ ] Map existing API routes for migration
- [ ] Review current authentication flow

## Phase 1: Supabase Database Setup (Days 2-3)

### 1.1 Database Schema Creation
```sql
-- Users extension (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('master_admin', 'admin', 'employee', 'client')),
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.user_profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'development', 'testing', 'deployed', 'maintenance')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  estimated_completion DATE,
  actual_completion DATE,
  budget DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Project milestones
CREATE TABLE public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Beta programs
CREATE TABLE public.beta_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  features JSONB,
  status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'active', 'closed')),
  max_participants INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Beta participants
CREATE TABLE public.beta_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beta_program_id UUID REFERENCES public.beta_programs(id),
  user_id UUID REFERENCES public.user_profiles(id),
  status TEXT DEFAULT 'active',
  feedback_count INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- CMS content
CREATE TABLE public.cms_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  section TEXT NOT NULL,
  content JSONB NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  published BOOLEAN DEFAULT false,
  author_id UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_slug, section)
);

-- CRM contacts
CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'client', 'inactive')),
  assigned_to UUID REFERENCES public.user_profiles(id),
  tags TEXT[],
  notes TEXT,
  last_contact DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social media posts
CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platforms TEXT[] NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_for TIMESTAMPTZ,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES public.user_profiles(id),
  performance_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id),
  resource TEXT NOT NULL,
  actions TEXT[] NOT NULL,
  conditions JSONB,
  granted_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource)
);
```

### 1.2 Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
-- ... (enable for all tables)

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
    )
  );

-- Projects policies
CREATE POLICY "Clients can view own projects" ON public.projects
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Admins and employees can view all projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'employee', 'master_admin')
    )
  );

-- Add similar policies for all tables
```

### 1.3 Database Functions & Triggers
```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Activity logging function
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Phase 2: Authentication System (Days 4-5)

### 2.1 Supabase Auth Configuration
```typescript
// client/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'client' // Default role
      }
    }
  })

  if (!error && data.user) {
    // Create user profile
    await supabase.from('user_profiles').insert({
      id: data.user.id,
      role: 'client'
    })
  }

  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}
```

### 2.2 Master Admin Initialization
```typescript
// server/functions/init-master-admin.ts
import { createClient } from '@supabase/supabase-js'

export const initMasterAdmin = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const email = process.env.MASTER_ADMIN_EMAIL!
  const password = process.env.MASTER_ADMIN_PASSWORD!

  // Check if master admin exists
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'master_admin')
    .single()

  if (!existingUser) {
    // Create master admin
    const { data: authUser, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (!error && authUser.user) {
      await supabase.from('user_profiles').insert({
        id: authUser.user.id,
        role: 'master_admin'
      })
    }
  }
}
```

### 2.3 Auth Context & Hooks
```typescript
// client/src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(data)
  }

  // ... implement auth methods

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
```

## Phase 3: Client Dashboard (Days 6-8)

### 3.1 Dashboard Layout
```typescript
// client/src/pages/dashboard/index.tsx
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'wouter'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default function Dashboard() {
  const { profile, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  // Role-based redirect
  switch (profile?.role) {
    case 'master_admin':
    case 'admin':
      return <Navigate to="/dashboard/admin" />
    case 'employee':
      return <Navigate to="/dashboard/employee" />
    case 'client':
      return <Navigate to="/dashboard/client" />
    default:
      return <Navigate to="/login" />
  }
}
```

### 3.2 Project Progress Tracker Component
```typescript
// client/src/components/dashboard/ProjectTracker.tsx
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function ProjectTracker({ projectId }: { projectId: string }) {
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*, project_milestones(*)')
        .eq('id', projectId)
        .single()
      return data
    }
  })

  const { data: milestones } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index')
      return data
    }
  })

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">
          {project?.name}
        </CardTitle>
        <p className="text-muted-foreground">{project?.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Progress</span>
              <span className="text-sm font-bold text-primary">{project?.progress}%</span>
            </div>
            <Progress value={project?.progress} className="h-3" />
          </div>

          {/* Milestones Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Milestones</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              {milestones?.map((milestone, index) => (
                <div key={milestone.id} className="relative flex items-start mb-6">
                  <div className="absolute left-4 w-8 h-8 -ml-4 bg-background rounded-full flex items-center justify-center">
                    {milestone.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="ml-12 flex-1">
                    <h4 className={`font-semibold ${milestone.completed ? 'text-primary' : 'text-foreground'}`}>
                      {milestone.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {milestone.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Due: {new Date(milestone.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 3.3 Beta Testing Hub
```typescript
// client/src/pages/dashboard/client/beta-testing.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function BetaTesting() {
  const { user } = useAuth()

  const { data: programs } = useQuery({
    queryKey: ['beta-programs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('beta_programs')
        .select('*, beta_participants(*)')
        .eq('status', 'recruiting')
      return data
    }
  })

  const { data: myPrograms } = useQuery({
    queryKey: ['my-beta-programs', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('beta_participants')
        .select('*, beta_programs(*)')
        .eq('user_id', user?.id)
      return data
    }
  })

  const joinBeta = useMutation({
    mutationFn: async (programId: string) => {
      const { data, error } = await supabase
        .from('beta_participants')
        .insert({
          beta_program_id: programId,
          user_id: user?.id
        })
      if (error) throw error
      return data
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Beta Testing Hub</h1>
        <p className="text-muted-foreground mt-2">
          Join beta programs to test new features and provide feedback
        </p>
      </div>

      {/* Active Programs */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">My Active Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myPrograms?.map((participant) => (
            <Card key={participant.id} className="bg-card border-border">
              <CardHeader>
                <CardTitle>{participant.beta_programs.name}</CardTitle>
                <CardDescription>{participant.beta_programs.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="default">Active Tester</Badge>
                  <Button variant="outline" size="sm">
                    Submit Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Programs */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs?.map((program) => {
            const isJoined = myPrograms?.some(p => p.beta_program_id === program.id)
            return (
              <Card key={program.id} className="bg-card border-border">
                <CardHeader>
                  <CardTitle>{program.name}</CardTitle>
                  <CardDescription>{program.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {program.features?.map((feature: string, i: number) => (
                        <Badge key={i} variant="secondary">{feature}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {program.beta_participants.length} / {program.max_participants} testers
                      </span>
                      <Button 
                        onClick={() => joinBeta.mutate(program.id)}
                        disabled={isJoined}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isJoined ? 'Joined' : 'Join Beta'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

## Phase 4: Admin Dashboard (Days 9-12)

### 4.1 CMS Editor Component
```typescript
// client/src/components/dashboard/CMSEditor.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function CMSEditor() {
  const [selectedPage, setSelectedPage] = useState('')
  const [selectedSection, setSelectedSection] = useState('')

  const pages = [
    { value: 'home', label: 'Home Page' },
    { value: 'solutions', label: 'Solutions' },
    { value: 'portfolio', label: 'Portfolio' },
    { value: 'resources', label: 'Resources' },
    { value: 'about', label: 'About' },
    { value: 'contact', label: 'Contact' }
  ]

  const { data: content, refetch } = useQuery({
    queryKey: ['cms-content', selectedPage, selectedSection],
    queryFn: async () => {
      if (!selectedPage || !selectedSection) return null
      const { data } = await supabase
        .from('cms_content')
        .select('*')
        .eq('page_slug', selectedPage)
        .eq('section', selectedSection)
        .single()
      return data
    },
    enabled: !!selectedPage && !!selectedSection
  })

  const updateContent = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('cms_content')
        .upsert({
          page_slug: selectedPage,
          section: selectedSection,
          ...updates
        })
      if (error) throw error
    },
    onSuccess: () => {
      refetch()
    }
  })

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Content Management System</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Page Selector */}
          <div className="grid grid-cols-2 gap-4">
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger>
                <SelectValue placeholder="Select a page" />
              </SelectTrigger>
              <SelectContent>
                {pages.map(page => (
                  <SelectItem key={page.value} value={page.value}>
                    {page.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hero">Hero Section</SelectItem>
                <SelectItem value="features">Features</SelectItem>
                <SelectItem value="cta">Call to Action</SelectItem>
                <SelectItem value="content">Main Content</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Editor */}
          {content && (
            <div className="space-y-4">
              <Input
                placeholder="Meta Title"
                value={content.meta_title || ''}
                onChange={(e) => updateContent.mutate({ meta_title: e.target.value })}
              />

              <Textarea
                placeholder="Meta Description"
                value={content.meta_description || ''}
                onChange={(e) => updateContent.mutate({ meta_description: e.target.value })}
              />

              {/* Rich Text Editor would go here */}
              <div className="border rounded-lg p-4 min-h-[300px]">
                {/* Implement TipTap or similar rich text editor */}
                <p className="text-muted-foreground">Rich text editor implementation</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Preview</Button>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => updateContent.mutate({ published: true })}
                >
                  Publish Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 4.2 CRM Dashboard
```typescript
// client/src/pages/dashboard/admin/crm/index.tsx
import { DataTable } from '@/components/ui/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ColumnDef } from '@tanstack/react-table'

interface Contact {
  id: string
  name: string
  email: string
  company: string
  status: string
  last_contact: string
  assigned_to: any
}

export default function CRMDashboard() {
  const { data: contacts } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_contacts')
        .select('*, assigned_to:user_profiles(id, email)')
        .order('created_at', { ascending: false })
      return data as Contact[]
    }
  })

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      )
    },
    {
      accessorKey: 'email',
      header: 'Email'
    },
    {
      accessorKey: 'company',
      header: 'Company'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variant = {
          lead: 'secondary',
          prospect: 'default',
          client: 'success',
          inactive: 'destructive'
        }[status] || 'default'

        return <Badge variant={variant as any}>{status}</Badge>
      }
    },
    {
      accessorKey: 'last_contact',
      header: 'Last Contact',
      cell: ({ row }) => {
        const date = row.getValue('last_contact') as string
        return date ? new Date(date).toLocaleDateString() : 'Never'
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">View</Button>
          <Button size="sm" variant="outline">Edit</Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <Button className="bg-primary hover:bg-primary/90">
          Add Contact
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {contacts?.filter(c => c.status === 'client').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prospects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts?.filter(c => c.status === 'prospect').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={contacts || []} />
        </CardContent>
      </Card>
    </div>
  )
}
```

## Phase 5: Vercel Deployment (Day 13)

### 5.1 Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  },
  "functions": {
    "api/*.ts": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### 5.2 Environment Variables Setup
```bash
# Production environment variables in Vercel Dashboard
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_KEY=your_service_key
MASTER_ADMIN_EMAIL=admin@strivetech.com
MASTER_ADMIN_PASSWORD=secure_production_password
```

### 5.3 Build Script Updates
```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "deploy": "vercel --prod",
    "supabase:migrate": "supabase db push",
    "supabase:generate-types": "supabase gen types typescript --local > src/types/supabase.ts"
  }
}
```

## Phase 6: Testing & Quality Assurance (Day 14)

### 6.1 Testing Checklist
- [ ] Authentication flows (signup, login, logout, password reset)
- [ ] Role-based access control for all dashboards
- [ ] Master admin permission system
- [ ] Client project tracking functionality
- [ ] Beta testing enrollment and feedback
- [ ] CMS content editing and publishing
- [ ] CRM contact management
- [ ] Social media scheduling
- [ ] Real-time updates via Supabase subscriptions
- [ ] Mobile responsiveness for all dashboards
- [ ] Performance metrics (Core Web Vitals)
- [ ] Security audit (RLS policies, input validation)

### 6.2 Performance Optimization
- Implement code splitting for dashboard routes
- Use React.lazy for heavy components
- Optimize bundle size with tree shaking
- Implement image optimization
- Add caching strategies
- Use database indexes for frequently queried data

### 6.3 Security Audit
- Verify all RLS policies are working
- Test SQL injection prevention
- Validate all user inputs with Zod
- Implement rate limiting
- Add CAPTCHA for public forms
- Set up monitoring and alerting

## Phase 7: Documentation & Handoff (Day 15)

### 7.1 Technical Documentation
- API endpoint documentation
- Database schema documentation
- Component library documentation
- Deployment guide
- Environment setup guide
- Troubleshooting guide

### 7.2 User Documentation
- Admin user guide
- Employee user guide
- Client user guide
- Video tutorials for key features
- FAQ section

### 7.3 Maintenance Plan
- Regular dependency updates
- Database backup strategy
- Performance monitoring setup
- Error tracking with Sentry
- Analytics implementation
- A/B testing framework

## Success Metrics

### Technical Metrics
- [ ] Page load time < 2 seconds
- [ ] Lighthouse score > 90
- [ ] Zero critical security vulnerabilities
- [ ] 99.9% uptime
- [ ] Database query response < 100ms

### Business Metrics
- [ ] User onboarding completion rate > 80%
- [ ] Client dashboard engagement > 60%
- [ ] Beta program participation > 40%
- [ ] CRM lead conversion improvement > 20%
- [ ] Content update frequency increased by 3x

## Risk Mitigation

### Potential Issues & Solutions

1. **Migration Complexity**
   - Risk: Data loss during migration
   - Solution: Implement staged migration with rollback capability

2. **Performance at Scale**
   - Risk: Slow queries with large datasets
   - Solution: Implement pagination, caching, and database indexing

3. **Security Vulnerabilities**
   - Risk: Unauthorized access to sensitive data
   - Solution: Regular security audits, penetration testing

4. **User Adoption**
   - Risk: Low adoption of new features
   - Solution: Comprehensive training, intuitive UI, gradual rollout

## Timeline Summary

- **Week 1** (Days 1-5): Database setup, authentication
- **Week 2** (Days 6-10): Client dashboard, admin CMS/CRM
- **Week 3** (Days 11-15): Employee dashboard, deployment, testing

Total Implementation Time: **15 working days**

## Next Steps

1. Review and approve plan
2. Set up Supabase project
3. Configure Vercel deployment
4. Begin Phase 0 implementation
5. Daily progress reviews
6. Weekly stakeholder updates

---

**Note**: This plan serves as a comprehensive guide. Actual implementation may require adjustments based on specific requirements and discoveries during development. Regular communication and iterative development are key to success.