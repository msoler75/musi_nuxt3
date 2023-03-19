import { defineStore } from "pinia";

export const useSettings = defineStore("settings", {
  state: () => {
    return {
      course: 0,
      currentLesson: ''
    };
  },
  persist: true
})
