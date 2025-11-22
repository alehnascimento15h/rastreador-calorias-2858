"use client"

import { useState, useEffect } from "react"
import { Camera, Plus, User, TrendingUp, Utensils, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

type UserProfile = {
  name: string
  weight: number
  height: number
  age: number
  dailyGoal: number
}

type Meal = {
  id: string
  name: string
  calories: number
  time: string
  imageUrl?: string
  isFromAI?: boolean
}

export default function CalorieTracker() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [meals, setMeals] = useState<Meal[]>([])
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isAddMealOpen, setIsAddMealOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    weight: "",
    height: "",
    age: "",
    dailyGoal: ""
  })

  const [mealForm, setMealForm] = useState({
    name: "",
    calories: ""
  })

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Load data from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem("calorieTrackerProfile")
    const savedMeals = localStorage.getItem("calorieTrackerMeals")
    
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile)
      setProfile(parsedProfile)
      setProfileForm({
        name: parsedProfile.name,
        weight: parsedProfile.weight.toString(),
        height: parsedProfile.height.toString(),
        age: parsedProfile.age.toString(),
        dailyGoal: parsedProfile.dailyGoal.toString()
      })
    }
    
    if (savedMeals) {
      setMeals(JSON.parse(savedMeals))
    }
  }, [])

  // Save profile
  const handleSaveProfile = () => {
    const newProfile: UserProfile = {
      name: profileForm.name,
      weight: parseFloat(profileForm.weight),
      height: parseFloat(profileForm.height),
      age: parseInt(profileForm.age),
      dailyGoal: parseInt(profileForm.dailyGoal)
    }
    
    setProfile(newProfile)
    localStorage.setItem("calorieTrackerProfile", JSON.stringify(newProfile))
    setIsProfileOpen(false)
    toast.success("Perfil salvo com sucesso!")
  }

  // Add manual meal
  const handleAddManualMeal = () => {
    if (!mealForm.name || !mealForm.calories) {
      toast.error("Preencha todos os campos")
      return
    }

    const newMeal: Meal = {
      id: Date.now().toString(),
      name: mealForm.name,
      calories: parseInt(mealForm.calories),
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      isFromAI: false
    }

    const updatedMeals = [...meals, newMeal]
    setMeals(updatedMeals)
    localStorage.setItem("calorieTrackerMeals", JSON.stringify(updatedMeals))
    
    setMealForm({ name: "", calories: "" })
    setIsAddMealOpen(false)
    toast.success("Refeição adicionada!")
  }

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Analyze meal from image using OpenAI Vision
  const handleAnalyzeMeal = async () => {
    if (!selectedImage || !imagePreview) {
      toast.error("Selecione uma foto da refeição")
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: imagePreview
        })
      })

      if (!response.ok) {
        throw new Error("Erro ao analisar imagem")
      }

      const data = await response.json()

      const newMeal: Meal = {
        id: Date.now().toString(),
        name: data.mealName,
        calories: data.calories,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        imageUrl: imagePreview,
        isFromAI: true
      }

      const updatedMeals = [...meals, newMeal]
      setMeals(updatedMeals)
      localStorage.setItem("calorieTrackerMeals", JSON.stringify(updatedMeals))

      setSelectedImage(null)
      setImagePreview(null)
      toast.success("Refeição analisada e adicionada!")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao analisar foto. Tente adicionar manualmente.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Calculate totals
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0)
  const dailyGoal = profile?.dailyGoal || 2000
  const progress = Math.min((totalCalories / dailyGoal) * 100, 100)
  const remaining = Math.max(dailyGoal - totalCalories, 0)

  // Reset daily meals (call this at midnight or manually)
  const handleResetDay = () => {
    setMeals([])
    localStorage.removeItem("calorieTrackerMeals")
    toast.success("Dia resetado!")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
              Rastreador de Calorias
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {profile ? `Olá, ${profile.name}! 👋` : "Configure seu perfil para começar"}
            </p>
          </div>
          
          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Seu Perfil</DialogTitle>
                <DialogDescription>
                  Configure suas informações para calcular sua meta diária
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={profileForm.weight}
                      onChange={(e) => setProfileForm({ ...profileForm, weight: e.target.value })}
                      placeholder="70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={profileForm.height}
                      onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
                      placeholder="170"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyGoal">Meta Diária (calorias)</Label>
                  <Input
                    id="dailyGoal"
                    type="number"
                    value={profileForm.dailyGoal}
                    onChange={(e) => setProfileForm({ ...profileForm, dailyGoal: e.target.value })}
                    placeholder="2000"
                  />
                </div>
                <Button onClick={handleSaveProfile} className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700">
                  Salvar Perfil
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress Card */}
        <Card className="mb-6 border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Progresso Diário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Consumido</span>
                <span className="font-bold text-orange-600">{totalCalories} / {dailyGoal} kcal</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Restante</p>
                <p className="text-2xl font-bold text-orange-600">{remaining}</p>
                <p className="text-xs text-gray-500">calorias</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Refeições</p>
                <p className="text-2xl font-bold text-pink-600">{meals.length}</p>
                <p className="text-xs text-gray-500">hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Meal Section */}
        <Tabs defaultValue="photo" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photo" className="gap-2">
              <Camera className="h-4 w-4" />
              Foto da Refeição
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Manual
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="photo">
            <Card>
              <CardHeader>
                <CardTitle>Analisar Refeição com IA</CardTitle>
                <CardDescription>
                  Tire uma foto da sua refeição e a IA calculará as calorias automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={handleAnalyzeMeal}
                          disabled={isAnalyzing}
                          className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
                        >
                          {isAnalyzing ? "Analisando..." : "Analisar Refeição"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedImage(null)
                            setImagePreview(null)
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <div className="space-y-2">
                        <Camera className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Clique para tirar foto ou selecionar imagem
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Manualmente</CardTitle>
                <CardDescription>
                  Insira o nome da refeição e as calorias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mealName">Nome da Refeição</Label>
                  <Input
                    id="mealName"
                    value={mealForm.name}
                    onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                    placeholder="Ex: Arroz com frango"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calories">Calorias</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={mealForm.calories}
                    onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                    placeholder="Ex: 450"
                  />
                </div>
                <Button
                  onClick={handleAddManualMeal}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
                >
                  Adicionar Refeição
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Meals List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-orange-500" />
                Refeições de Hoje
              </CardTitle>
              {meals.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleResetDay}>
                  Resetar Dia
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {meals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma refeição registrada hoje</p>
                <p className="text-sm">Adicione sua primeira refeição acima!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border hover:shadow-md transition-shadow"
                  >
                    {meal.imageUrl ? (
                      <img src={meal.imageUrl} alt={meal.name} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-pink-200 dark:from-orange-900 dark:to-pink-900 rounded-lg flex items-center justify-center">
                        <Utensils className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{meal.name}</h4>
                        {meal.isFromAI && (
                          <span className="text-xs bg-gradient-to-r from-orange-500 to-pink-600 text-white px-2 py-0.5 rounded-full">
                            IA
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{meal.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-600">{meal.calories}</p>
                      <p className="text-xs text-gray-500">kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
