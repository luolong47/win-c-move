import { createRouter, createWebHashHistory } from 'vue-router'
import WelcomeView from '../views/WelcomeView.vue'
import ConfigView from '../views/ConfigView.vue'
import MigrationView from '../views/MigrationView.vue'
import HistoryView from '../views/HistoryView.vue'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', component: WelcomeView },
        { path: '/config', component: ConfigView },
        { path: '/migration', component: MigrationView },
        { path: '/history', component: HistoryView }
    ]
})

export default router
